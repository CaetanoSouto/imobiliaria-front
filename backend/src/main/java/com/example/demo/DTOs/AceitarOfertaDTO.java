package com.example.demo.DTOs;

import lombok.Getter;
import lombok.Setter;

// Corpo (opcional) do PATCH /ofertas/{id}/aceitar
@Getter
@Setter
public class AceitarOfertaDTO {
    private String condicoes;
}
