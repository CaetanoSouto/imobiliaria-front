package com.example.demo.DTOs;

import lombok.Getter;
import lombok.Setter;

// Corpo do PUT /fotos/{id}
@Getter
@Setter
public class FotoUpdateDTO {
    private Boolean capa;
    private Integer ordem;
}
