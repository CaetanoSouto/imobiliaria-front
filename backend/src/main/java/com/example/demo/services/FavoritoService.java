package com.example.demo.services;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.exceptions.RecursoNaoEncontradoException;
import com.example.demo.exceptions.RegraNegocioException;
import com.example.demo.models.FavoritoModel;
import com.example.demo.models.ImovelModel;
import com.example.demo.models.UserModel;
import com.example.demo.repositories.FavoritoRepository;
import com.example.demo.repositories.ImovelRepository;
import com.example.demo.repositories.UserRepository;

@Service
@Transactional
public class FavoritoService {

    private final FavoritoRepository favoritoRepository;
    private final ImovelRepository imovelRepository;
    private final UserRepository userRepository;

    public FavoritoService(FavoritoRepository favoritoRepository, ImovelRepository imovelRepository,
            UserRepository userRepository) {
        this.favoritoRepository = favoritoRepository;
        this.imovelRepository = imovelRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<FavoritoModel> listar(String email) {
        return favoritoRepository.findByUsuarioIdOrderByIdDesc(usuario(email).getId());
    }

    public FavoritoModel adicionar(String email, Integer imovelId) {
        UserModel usuario = usuario(email);
        ImovelModel imovel = imovelRepository.findById(imovelId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Imóvel não encontrado."));
        if (favoritoRepository.findByUsuarioIdAndImovelId(usuario.getId(), imovelId).isPresent()) {
            throw new RegraNegocioException("Este imóvel já está nos seus favoritos.");
        }
        FavoritoModel favorito = new FavoritoModel();
        favorito.setUsuario(usuario);
        favorito.setImovel(imovel);
        return favoritoRepository.save(favorito);
    }

    public void remover(String email, Integer imovelId) {
        FavoritoModel favorito = favoritoRepository.findByUsuarioIdAndImovelId(usuario(email).getId(), imovelId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Este imóvel não está nos seus favoritos."));
        favoritoRepository.delete(favorito);
    }

    private UserModel usuario(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Usuário não encontrado."));
    }
}
