package com.example.demo.DTOs;

import java.math.BigDecimal;

import lombok.Getter;
import lombok.Setter;

// Corpo do POST /ofertas
@Getter
@Setter
public class OfertaRequestDTO {
    private Integer imovelId;
    private String tipo; // ALUGUEL ou VENDA
    private BigDecimal valorProposto;
    private String mensagem;
}
