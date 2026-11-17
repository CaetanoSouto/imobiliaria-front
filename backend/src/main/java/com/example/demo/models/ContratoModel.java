package com.example.demo.models;

import java.io.Serializable;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import lombok.Getter;
import lombok.Setter;

// Contrato preparado pelo corretor quando ele aceita uma oferta.
// Fluxo: AGUARDANDO_APROVACAO (corretor preparou) -> AGUARDANDO_ASSINATURA (admin aprovou)
//        -> ASSINADO (cliente assinou). O admin pode CANCELAR (reprovar) a qualquer momento.
@Entity
@Table(name = "contratos")
@Getter
@Setter
public class ContratoModel implements Serializable {
    private static final long serialVersionUID = 1L;

    public static final String AGUARDANDO_APROVACAO = "AGUARDANDO_APROVACAO";
    public static final String AGUARDANDO_ASSINATURA = "AGUARDANDO_ASSINATURA";
    public static final String ASSINADO = "ASSINADO";
    public static final String CANCELADO = "CANCELADO";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "oferta_id", nullable = false)
    private OfertaModel oferta;

    // caminho do PDF do contrato (gerado/enviado pelo admin)
    private String pdf;

    @Column(nullable = false)
    private String status;

    // condições combinadas, escritas pelo corretor ao preparar o contrato
    @Column(columnDefinition = "text")
    private String condicoes;

    @Column(name = "data_criacao")
    private LocalDateTime dataCriacao;

    @Column(name = "data_assinatura")
    private LocalDateTime dataAssinatura;

    @Column(name = "data_aprovacao")
    private LocalDateTime dataAprovacao;

    // Só na resposta de aprovar/cancelar (não vai para o banco): o cliente foi avisado por e-mail?
    @Transient
    private Boolean emailEnviado;
}
