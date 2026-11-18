package com.example.demo.services;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.exceptions.AcessoProibidoException;
import com.example.demo.exceptions.RecursoNaoEncontradoException;
import com.example.demo.exceptions.RegraNegocioException;
import com.example.demo.models.ContratoModel;
import com.example.demo.models.ImovelModel;
import com.example.demo.models.OfertaModel;
import com.example.demo.models.UserModel;
import com.example.demo.repositories.ContratoRepository;
import com.example.demo.repositories.ImovelRepository;
import com.example.demo.repositories.OfertaRepository;
import com.example.demo.repositories.UserRepository;

// Regras de negócio dos contratos (assinar e cancelar). Cada operação é uma transação.
@Service
@Transactional
public class ContratoService {

    private final ContratoRepository contratoRepository;
    private final OfertaRepository ofertaRepository;
    private final ImovelRepository imovelRepository;
    private final UserRepository userRepository;

    private final ContratoPdfService pdfService;
    private final NotificacaoService notificacao;

    public ContratoService(ContratoRepository contratoRepository, OfertaRepository ofertaRepository,
            ImovelRepository imovelRepository, UserRepository userRepository,
            ContratoPdfService pdfService, NotificacaoService notificacao) {
        this.contratoRepository = contratoRepository;
        this.ofertaRepository = ofertaRepository;
        this.imovelRepository = imovelRepository;
        this.userRepository = userRepository;
        this.pdfService = pdfService;
        this.notificacao = notificacao;
    }

    @Transactional(readOnly = true)
    public List<ContratoModel> meus(String emailCliente) {
        UserModel cliente = userRepository.findByEmail(emailCliente)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Usuário não encontrado."));
        return contratoRepository.findByOfertaUsuarioIdOrderByIdDesc(cliente.getId());
    }

    @Transactional(readOnly = true)
    public List<ContratoModel> todos() {
        return contratoRepository.findAllByOrderByIdDesc();
    }

    // Aprovar (admin): libera o contrato preparado pelo corretor para o cliente assinar.
    public ContratoModel aprovar(Integer id) {
        ContratoModel contrato = buscar(id);
        if (!ContratoModel.AGUARDANDO_APROVACAO.equals(contrato.getStatus())) {
            throw new RegraNegocioException("Este contrato não está aguardando aprovação.");
        }
        contrato.setStatus(ContratoModel.AGUARDANDO_ASSINATURA);
        contrato.setDataAprovacao(LocalDateTime.now());

        // gera o PDF, guarda uma cópia e manda para o cliente por e-mail
        byte[] pdf = pdfService.gerar(contrato);
        contrato.setPdf(pdfService.gravar(contrato, pdf));
        contratoRepository.save(contrato);

        String imovel = contrato.getOferta().getImovel().getTitulo();
        contrato.setEmailEnviado(notificar(contrato,
                "Seu contrato foi aprovado - " + imovel,
                "Olá, " + contrato.getOferta().getUsuario().getNome() + "!\n\n"
                        + "O contrato do imóvel \"" + imovel + "\" foi aprovado e já está disponível para assinatura.\n"
                        + "Ele segue em anexo em PDF. Para assinar, entre no sistema e abra \"Contratos\".\n\n"
                        + "Atenciosamente,\nImobiliária",
                "contrato-" + contrato.getId() + ".pdf", pdf));
        return contrato;
    }

    // PDF do contrato. O cliente só baixa o seu, e só depois de aprovado; corretor e admin baixam qualquer um.
    @Transactional(readOnly = true)
    public byte[] pdf(Integer id, String email, boolean funcionario) {
        ContratoModel contrato = buscar(id);
        if (!funcionario) {
            if (!contrato.getOferta().getUsuario().getEmail().equals(email)) {
                throw new AcessoProibidoException("Este contrato pertence a outro usuário.");
            }
            if (ContratoModel.AGUARDANDO_APROVACAO.equals(contrato.getStatus())) {
                throw new RegraNegocioException("Este contrato ainda não foi aprovado.");
            }
        }
        return pdfService.gerar(contrato);
    }

    // Envia o aviso ao cliente. Nunca derruba a operação: devolve se o e-mail saiu ou não.
    private boolean notificar(ContratoModel contrato, String assunto, String corpo, String nomeAnexo, byte[] anexo) {
        String para = contrato.getOferta().getUsuario().getEmail();
        if (para == null || para.isBlank()) {
            return false;
        }
        return notificacao.enviar(para, assunto, corpo, nomeAnexo, anexo);
    }

    // Assinar: o imóvel vira ALUGADO ou VENDIDO conforme o tipo da oferta e todas as
    // outras ofertas do imóvel (pendentes ou em espera) são RECUSADAS.
    public ContratoModel assinar(Integer id, String emailCliente) {
        ContratoModel contrato = buscar(id);
        OfertaModel oferta = contrato.getOferta();
        if (!oferta.getUsuario().getEmail().equals(emailCliente)) {
            throw new AcessoProibidoException("Este contrato pertence a outro usuário.");
        }
        if (!ContratoModel.AGUARDANDO_ASSINATURA.equals(contrato.getStatus())) {
            throw new RegraNegocioException("Este contrato não está aguardando assinatura.");
        }

        contrato.setStatus(ContratoModel.ASSINADO);
        contrato.setDataAssinatura(LocalDateTime.now());
        contratoRepository.save(contrato);

        ImovelModel imovel = oferta.getImovel();
        imovel.setStatus("ALUGUEL".equals(oferta.getTipo()) ? "ALUGADO" : "VENDIDO");
        imovelRepository.save(imovel);

        for (OfertaModel outra : ofertaRepository.findByImovelId(imovel.getId())) {
            if (!outra.getId().equals(oferta.getId())
                    && (OfertaModel.PENDENTE.equals(outra.getStatus())
                            || OfertaModel.EM_ESPERA.equals(outra.getStatus()))) {
                outra.setStatus(OfertaModel.RECUSADA);
                ofertaRepository.save(outra);
            }
        }

        // confirma a assinatura ao cliente, com o contrato assinado em anexo
        String titulo = imovel.getTitulo();
        contrato.setEmailEnviado(notificar(contrato,
                "Contrato assinado - " + titulo,
                "Olá, " + oferta.getUsuario().getNome() + "!\n\n"
                        + "Recebemos a sua assinatura no contrato do imóvel \"" + titulo + "\".\n"
                        + "Uma cópia do contrato assinado segue em anexo, em PDF.\n\n"
                        + "Atenciosamente,\nImobiliária",
                "contrato-" + contrato.getId() + ".pdf", pdfService.gerar(contrato)));
        return contrato;
    }

    // Cancelar (admin, quando o cliente desiste): o contrato fica CANCELADO, a oferta
    // CANCELADA e o imóvel volta a ficar DISPONIVEL. As ofertas que estavam EM_ESPERA
    // voltam a PENDENTE para o imóvel poder receber ofertas de novo.
    public ContratoModel cancelar(Integer id) {
        ContratoModel contrato = buscar(id);
        if (ContratoModel.CANCELADO.equals(contrato.getStatus())) {
            throw new RegraNegocioException("Este contrato já está cancelado.");
        }

        contrato.setStatus(ContratoModel.CANCELADO);
        contratoRepository.save(contrato);

        OfertaModel oferta = contrato.getOferta();
        oferta.setStatus(OfertaModel.CANCELADA);
        ofertaRepository.save(oferta);

        ImovelModel imovel = oferta.getImovel();
        imovel.setStatus(OfertaService.DISPONIVEL);
        imovelRepository.save(imovel);

        for (OfertaModel outra : ofertaRepository.findByImovelId(imovel.getId())) {
            if (OfertaModel.EM_ESPERA.equals(outra.getStatus())) {
                outra.setStatus(OfertaModel.PENDENTE);
                ofertaRepository.save(outra);
            }
        }
        String titulo = imovel.getTitulo();
        contrato.setEmailEnviado(notificar(contrato,
                "Seu contrato foi cancelado - " + titulo,
                "Olá, " + oferta.getUsuario().getNome() + ".\n\n"
                        + "O contrato do imóvel \"" + titulo + "\" foi cancelado pela imobiliária.\n"
                        + "Em caso de dúvidas, entre em contato conosco.\n\n"
                        + "Atenciosamente,\nImobiliária",
                null, null));
        return contrato;
    }

    private ContratoModel buscar(Integer id) {
        return contratoRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Contrato não encontrado."));
    }
}
