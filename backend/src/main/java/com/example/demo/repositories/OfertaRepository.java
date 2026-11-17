package com.example.demo.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.models.OfertaModel;

public interface OfertaRepository extends JpaRepository<OfertaModel, Integer> {

    List<OfertaModel> findByUsuarioIdOrderByDataCriacaoDesc(Integer usuarioId);

    List<OfertaModel> findAllByOrderByDataCriacaoDesc();

    List<OfertaModel> findByStatusOrderByDataCriacaoDesc(String status);

    List<OfertaModel> findByImovelId(Integer imovelId);

    boolean existsByUsuarioId(Integer usuarioId);

    boolean existsByImovelId(Integer imovelId);

    boolean existsByUsuarioIdAndImovelIdAndStatus(Integer usuarioId, Integer imovelId, String status);
}
