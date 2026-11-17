package com.example.demo.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.models.FavoritoModel;

public interface FavoritoRepository extends JpaRepository<FavoritoModel, Integer> {

    List<FavoritoModel> findByUsuarioIdOrderByIdDesc(Integer usuarioId);

    Optional<FavoritoModel> findByUsuarioIdAndImovelId(Integer usuarioId, Integer imovelId);

    // usados ao excluir um usuário ou um imóvel (os favoritos dele vão junto)
    void deleteByUsuarioId(Integer usuarioId);

    void deleteByImovelId(Integer imovelId);
}
