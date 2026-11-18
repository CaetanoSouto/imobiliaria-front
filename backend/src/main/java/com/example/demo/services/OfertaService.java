package com.example.demo.services;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.DTOs.OfertaRequestDTO;
import com.example.demo.exceptions.AcessoProibidoException;
import com.example.demo.exceptions.RecursoNaoEncontradoException;
import com.example.demo.exceptions.RegraNegocioException;
import com.example.demo.exceptions.RequisicaoInvalidaException;
import com.example.demo.models.ContratoModel;
import com.example.demo.models.ImovelModel;
import com.example.demo.models.OfertaModel;
import com.example.demo.models.UserModel;
import com.example.demo.repositories.ContratoRepository;
import com.example.demo.repositories.ImovelRepository;
import com.example.demo.repositories.OfertaRepository;
import com.example.demo.repositories.UserRepository;

// Regras de negócio das ofertas. Cada operação roda em uma transação: ou muda tudo
// (oferta, imóvel, outras ofertas, contrato) ou não muda nada.
@Service
@Transactional
public class OfertaService {

    public static final String DISPONIVEL = "DISPONIVEL";
    public static final String RESERVADO = "RESERVADO";

    private final OfertaRepository ofertaRepository;
    private final ImovelRepository imovelRepository;
    private final UserRepository userRepository;
    private final ContratoRepository contratoRepository;
    private final NotificacaoService notificacao;

    public OfertaService(OfertaRepository ofertaRepository, ImovelRepository imovelRepository,
            UserRepository userRepository, ContratoRepository contratoRepository,
            NotificacaoService notificacao) {
        this.ofertaRepository = ofertaRepository;
        this.imovelRepository = imovelRepository;
        this.userRepository = userRepository;
        this.contratoRepository = contratoRepository;
        this.notificacao = notificacao;
    }

    // ---- Cliente ----

    // Regras: só imóvel DISPONIVEL recebe oferta; um cliente não pode ter duas ofertas
    // PENDENTES para o mesmo imóvel; vários clientes podem ofertar ao mesmo tempo.
    public OfertaModel criar(String emailCliente, OfertaRequestDTO dto) {
        if (dto == null || dto.getImovelId() == null) {
            throw new RequisicaoInvalidaException("Informe o imóvel da oferta.");
        }
        String tipo = dto.getTipo() == null ? "" : dto.getTipo().trim().toUpperCase();
        if (!tipo.equals("ALUGUEL") && !tipo.equals("VENDA")) {
            throw new RequisicaoInvalidaException("O tipo da oferta deve ser ALUGUEL ou VENDA.");
        }
        if (dto.getValorProposto() == null || dto.getValorProposto().compareTo(BigDecimal.ZERO) <= 0) {
            throw new RequisicaoInvalidaException("Informe um valor proposto maior que zero.");
        }

        UserModel cliente = usuario(emailCliente);
        ImovelModel imovel = imovelRepository.findById(dto.getImovelId())
                .orElseThrow(() -> new RecursoNaoEncontradoException("Imóvel não encontrado."));

        if (!DISPONIVEL.equals(imovel.getStatus())) {
            throw new RegraNegocioException("Este imóvel não está disponível para receber ofertas.");
        }
        if (imovel.getFinalidade() != null && !imovel.getFinalidade().equalsIgnoreCase(tipo)) {
            throw new RegraNegocioException("Este imóvel é para " + imovel.getFinalidade().toLowerCase()
                    + ". A oferta deve ser do tipo " + imovel.getFinalidade() + ".");
        }
        if (ofertaRepository.existsByUsuarioIdAndImovelIdAndStatus(cliente.getId(), imovel.getId(),
                OfertaModel.PENDENTE)) {
            throw new RegraNegocioException("Você já tem uma oferta pendente para este imóvel.");
        }

        OfertaModel oferta = new OfertaModel();
        oferta.setImovel(imovel);
        oferta.setUsuario(cliente);
        oferta.setTipo(tipo);
        oferta.setValorProposto(dto.getValorProposto());
        oferta.setMensagem(dto.getMensagem() == null ? null : dto.getMensagem().trim());
        oferta.setStatus(OfertaModel.PENDENTE);
        oferta.setDataCriacao(LocalDateTime.now());
        return ofertaRepository.save(oferta);
    }

    @Transactional(readOnly = true)
    public List<OfertaModel> minhas(String emailCliente) {
        return ofertaRepository.findByUsuarioIdOrderByDataCriacaoDesc(usuario(emailCliente).getId());
    }

    // O cliente desiste de uma oferta que ainda não foi aceita.
    public OfertaModel cancelar(Integer id, String emailCliente) {
        OfertaModel oferta = buscar(id);
        if (!oferta.getUsuario().getEmail().equals(emailCliente)) {
            throw new AcessoProibidoException("Esta oferta pertence a outro usuário.");
        }
        if (!OfertaModel.PENDENTE.equals(oferta.getStatus()) && !OfertaModel.EM_ESPERA.equals(oferta.getStatus())) {
            throw new RegraNegocioException(
                    "Só é possível cancelar ofertas pendentes ou em espera. Para uma oferta aceita, peça o cancelamento do contrato.");
        }
        oferta.setStatus(OfertaModel.CANCELADA);
        return ofertaRepository.save(oferta);
    }

    // ---- Admin ----

    @Transactional(readOnly = true)
    public List<OfertaModel> todas(String status) {
        if (status == null || status.isBlank()) {
            return ofertaRepository.findAllByOrderByDataCriacaoDesc();
        }
        return ofertaRepository.findByStatusOrderByDataCriacaoDesc(status.trim().toUpperCase());
    }

    // Aceitar (corretor): a oferta vira ACEITA, o imóvel fica RESERVADO, as outras ofertas
    // PENDENTES do mesmo imóvel passam para EM_ESPERA e o contrato é preparado, ficando
    // AGUARDANDO_APROVACAO do administrador.
    public OfertaModel aceitar(Integer id, String condicoes) {
        OfertaModel oferta = buscar(id);
        if (!OfertaModel.PENDENTE.equals(oferta.getStatus())) {
            throw new RegraNegocioException("Só é possível aceitar ofertas pendentes.");
        }
        ImovelModel imovel = oferta.getImovel();
        if (!DISPONIVEL.equals(imovel.getStatus())) {
            throw new RegraNegocioException("O imóvel não está disponível para aceitar esta oferta.");
        }

        oferta.setStatus(OfertaModel.ACEITA);
        ofertaRepository.save(oferta);

        imovel.setStatus(RESERVADO);
        imovelRepository.save(imovel);

        for (OfertaModel outra : ofertaRepository.findByImovelId(imovel.getId())) {
            if (!outra.getId().equals(oferta.getId()) && OfertaModel.PENDENTE.equals(outra.getStatus())) {
                outra.setStatus(OfertaModel.EM_ESPERA);
                ofertaRepository.save(outra);
            }
        }

        ContratoModel contrato = new ContratoModel();
        contrato.setOferta(oferta);
        contrato.setStatus(ContratoModel.AGUARDANDO_APROVACAO);
        contrato.setCondicoes(condicoes == null || condicoes.isBlank() ? null : condicoes.trim());
        contrato.setDataCriacao(LocalDateTime.now());
        contratoRepository.save(contrato);

        oferta.setEmailEnviado(notificacao.enviar(oferta.getUsuario().getEmail(), AvisosCliente.ofertaAceita(oferta)));
        return oferta;
    }

    public OfertaModel recusar(Integer id) {
        OfertaModel oferta = buscar(id);
        if (!OfertaModel.PENDENTE.equals(oferta.getStatus()) && !OfertaModel.EM_ESPERA.equals(oferta.getStatus())) {
            throw new RegraNegocioException("Só é possível recusar ofertas pendentes ou em espera.");
        }
        oferta.setStatus(OfertaModel.RECUSADA);
        ofertaRepository.save(oferta);

        oferta.setEmailEnviado(notificacao.enviar(oferta.getUsuario().getEmail(), AvisosCliente.ofertaRecusada(oferta)));
        return oferta;
    }

    // ---- util ----

    private OfertaModel buscar(Integer id) {
        return ofertaRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Oferta não encontrada."));
    }

    private UserModel usuario(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Usuário não encontrado."));
    }
}
