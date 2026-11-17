package com.example.demo.services;


import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import com.example.demo.exceptions.RecursoNaoEncontradoException;
import com.example.demo.exceptions.RequisicaoInvalidaException;
import com.example.demo.models.FotoImovelModel;
import com.example.demo.models.ImovelModel;
import com.example.demo.repositories.FotoImovelRepository;
import com.example.demo.repositories.ImovelRepository;


@Service
public class FotoImovelService {
    @Autowired
    private FotoImovelRepository fotoImovelRepository;

    @Autowired
    private ImovelRepository imovelRepository;

    @Value("${app.upload-dir}")
    private String uploadDir;

    // A primeira foto do imóvel vira a capa; as seguintes entram no fim da ordem.
    public FotoImovelModel salvar(MultipartFile arquivo, Integer imovelId) {
        ImovelModel imovel = imovelRepository.findById(imovelId)
            .orElseThrow(() -> new RecursoNaoEncontradoException("Imóvel não encontrado."));

        if (arquivo == null || arquivo.isEmpty()) {
            throw new RequisicaoInvalidaException("Escolha um arquivo de foto.");
        }
        String tipo = arquivo.getContentType();
        if (tipo == null || !tipo.startsWith("image/")) {
            throw new RequisicaoInvalidaException("O arquivo precisa ser uma imagem (JPG, PNG, WEBP...).");
        }

        try {
            Path pasta = Paths.get(uploadDir, String.valueOf(imovelId));
            Files.createDirectories(pasta);

            String nomeOriginal = StringUtils.cleanPath(arquivo.getOriginalFilename() == null ? "" : arquivo.getOriginalFilename());
            if (nomeOriginal.isBlank()) {
                throw new RequisicaoInvalidaException("O arquivo precisa ter um nome.");
            }

            String nomeFinal = UUID.randomUUID() + "_" + nomeOriginal;
            Path destino = pasta.resolve(nomeFinal);
            arquivo.transferTo(destino);

            List<FotoImovelModel> existentes = fotoImovelRepository.findByImovelId(imovelId);
            int proximaOrdem = existentes.stream()
                    .mapToInt(f -> f.getOrdem() == null ? 0 : f.getOrdem() + 1)
                    .max().orElse(0);

            FotoImovelModel model = new FotoImovelModel();
            model.setCaminho(destino.toString());
            model.setNomeArquivo(nomeFinal);
            model.setImovel(imovel);
            model.setOrdem(proximaOrdem);
            model.setCapa(existentes.isEmpty());

            return fotoImovelRepository.save(model);
        } catch (IOException e) {
            throw new RuntimeException("Erro ao salvar a foto do imóvel", e);
        }
    }

    // Editar: define se é a capa e a posição. Só uma foto por imóvel pode ser a capa.
    @Transactional
    public FotoImovelModel atualizar(Integer id, Boolean capa, Integer ordem) {
        FotoImovelModel foto = fotoImovelRepository.findById(id)
            .orElseThrow(() -> new RecursoNaoEncontradoException("Foto não encontrada."));
        if (ordem != null) {
            if (ordem < 0) {
                throw new RequisicaoInvalidaException("A ordem não pode ser negativa.");
            }
            foto.setOrdem(ordem);
        }
        if (capa != null) {
            if (capa) {
                for (FotoImovelModel outra : fotoImovelRepository.findByImovelId(foto.getImovel().getId())) {
                    if (!outra.getId().equals(foto.getId()) && Boolean.TRUE.equals(outra.getCapa())) {
                        outra.setCapa(false);
                        fotoImovelRepository.save(outra);
                    }
                }
            }
            foto.setCapa(capa);
        }
        return fotoImovelRepository.save(foto);
    }

    // Excluir uma foto. Se ela era a capa, a primeira foto que sobrar assume o lugar.
    @Transactional
    public void excluir(Integer id) {
        FotoImovelModel foto = fotoImovelRepository.findById(id)
            .orElseThrow(() -> new RecursoNaoEncontradoException("Foto não encontrada."));
        Integer imovelId = foto.getImovel().getId();
        boolean eraCapa = Boolean.TRUE.equals(foto.getCapa());
        apagarArquivo(foto);
        fotoImovelRepository.delete(foto);
        if (eraCapa) {
            fotoImovelRepository.findByImovelId(imovelId).stream()
                    .filter(f -> !f.getId().equals(id))
                    .min((a, b) -> Integer.compare(a.getOrdem() == null ? 0 : a.getOrdem(),
                            b.getOrdem() == null ? 0 : b.getOrdem()))
                    .ifPresent(nova -> {
                        nova.setCapa(true);
                        fotoImovelRepository.save(nova);
                    });
        }
    }

    // Usado ao excluir o imóvel: remove todas as fotos dele.
    @Transactional
    public void excluirDoImovel(Integer imovelId) {
        List<FotoImovelModel> fotos = fotoImovelRepository.findByImovelId(imovelId);
        fotos.forEach(this::apagarArquivo);
        fotoImovelRepository.deleteAll(fotos);
        try {
            // remove também a pasta do imóvel, se ficou vazia (se tiver algo dentro, ela é mantida)
            Files.deleteIfExists(Paths.get(uploadDir, String.valueOf(imovelId)));
        } catch (IOException e) {
            // pasta não vazia ou sem permissão: não atrapalha a exclusão do imóvel
        }
    }

    // Só apaga arquivos enviados (as fotos de exemplo são links http e não têm arquivo).
    private void apagarArquivo(FotoImovelModel foto) {
        String caminho = foto.getCaminho();
        if (caminho == null || caminho.startsWith("http")) {
            return;
        }
        try {
            Files.deleteIfExists(Paths.get(caminho));
        } catch (IOException e) {
            // o registro é removido mesmo assim; um arquivo órfão não atrapalha o sistema
        }
    }
}
