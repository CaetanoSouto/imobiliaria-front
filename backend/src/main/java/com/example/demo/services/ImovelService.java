package com.example.demo.services;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.exceptions.RecursoNaoEncontradoException;
import com.example.demo.exceptions.RegraNegocioException;
import com.example.demo.exceptions.RequisicaoInvalidaException;
import com.example.demo.models.ImovelModel;
import com.example.demo.repositories.FavoritoRepository;
import com.example.demo.repositories.ImovelRepository;
import com.example.demo.repositories.OfertaRepository;

@Service
public class ImovelService {
    public static final List<String> STATUS = List.of("DISPONIVEL", "RESERVADO", "ALUGADO", "VENDIDO", "INDISPONIVEL");

    private final ImovelRepository repository;
    private final OfertaRepository ofertaRepository;
    private final FavoritoRepository favoritoRepository;
    private final FotoImovelService fotoService;

    public ImovelService(ImovelRepository repository, OfertaRepository ofertaRepository,
            FavoritoRepository favoritoRepository, FotoImovelService fotoService) {
        this.repository = repository;
        this.ofertaRepository = ofertaRepository;
        this.favoritoRepository = favoritoRepository;
        this.fotoService = fotoService;
    }

    public List<ImovelModel> getAll() {
        List<ImovelModel> list = repository.findAll();
        return list;
    }

    public ImovelModel find(Integer id) {
        Optional<ImovelModel> model = repository.findById(id);
        return model.orElse(null);
    }

    public ImovelModel insert(ImovelModel model) {
        validar(model);
        return repository.save(model);
    }

    // Devolve null quando o imóvel não existe (o controller responde 404).
    public ImovelModel update(ImovelModel model) {
        validar(model);
        if (model.getId() == null || find(model.getId()) == null) {
            return null;
        }
        return repository.save(model);
    }

    // Excluir (admin). Um imóvel que já recebeu ofertas fica (o histórico depende dele): nesse caso
    // o admin marca como indisponível. Fotos (e os arquivos enviados) e favoritos vão junto.
    @Transactional
    public void delete(Integer id) {
        if (find(id) == null) {
            throw new RecursoNaoEncontradoException("Imóvel não encontrado.");
        }
        if (ofertaRepository.existsByImovelId(id)) {
            throw new RegraNegocioException(
                    "Este imóvel tem ofertas registradas e não pode ser excluído. Marque-o como indisponível.");
        }
        favoritoRepository.deleteByImovelId(id);
        fotoService.excluirDoImovel(id);
        repository.deleteById(id);
    }

    public ImovelModel alterarStatus(Integer id, String status) {
        ImovelModel model = find(id);
        if (model == null) {
            return null;
        }
        model.setStatus(status);
        return repository.save(model);
    }

    // Campos obrigatórios e coerência entre finalidade e preço. Sem status, o imóvel nasce DISPONIVEL.
    private void validar(ImovelModel m) {
        if (m.getTitulo() == null || m.getTitulo().isBlank()) {
            throw new RequisicaoInvalidaException("Informe o título do imóvel.");
        }
        String finalidade = m.getFinalidade() == null ? "" : m.getFinalidade().trim().toUpperCase();
        if (!finalidade.equals("VENDA") && !finalidade.equals("ALUGUEL")) {
            throw new RequisicaoInvalidaException("A finalidade deve ser VENDA ou ALUGUEL.");
        }
        m.setFinalidade(finalidade);
        if (finalidade.equals("VENDA") && !positivo(m.getPrecoVenda())) {
            throw new RequisicaoInvalidaException("Informe um preço de venda maior que zero.");
        }
        if (finalidade.equals("ALUGUEL") && !positivo(m.getPrecoAluguel())) {
            throw new RequisicaoInvalidaException("Informe um valor de aluguel maior que zero.");
        }
        if (m.getTipoImovel() == null || m.getTipoImovel().getId() == null) {
            throw new RequisicaoInvalidaException("Informe o tipo do imóvel.");
        }
        if (m.getBairro() == null || m.getBairro().getId() == null) {
            throw new RequisicaoInvalidaException("Informe o bairro do imóvel.");
        }
        if (m.getStatus() == null || m.getStatus().isBlank()) {
            m.setStatus("DISPONIVEL");
        } else if (!STATUS.contains(m.getStatus().trim().toUpperCase())) {
            throw new RequisicaoInvalidaException("Situação inválida do imóvel.");
        } else {
            m.setStatus(m.getStatus().trim().toUpperCase());
        }
    }

    private boolean positivo(BigDecimal valor) {
        return valor != null && valor.compareTo(BigDecimal.ZERO) > 0;
    }
}
