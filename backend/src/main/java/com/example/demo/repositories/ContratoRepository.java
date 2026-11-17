package com.example.demo.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.models.ContratoModel;

public interface ContratoRepository extends JpaRepository<ContratoModel, Integer> {

    List<ContratoModel> findByOfertaUsuarioIdOrderByIdDesc(Integer usuarioId);

    List<ContratoModel> findAllByOrderByIdDesc();
}
