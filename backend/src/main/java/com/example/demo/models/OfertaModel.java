package com.example.demo.models;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

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

// Oferta de um cliente (aluguel ou venda) por um imóvel.
// status: PENDENTE, ACEITA, EM_ESPERA, RECUSADA, CANCELADA
@Entity
@Table(name = "ofertas")
@Getter
@Setter
public class OfertaModel implements Serializable {
    private static final long serialVersionUID = 1L;

    public static final String PENDENTE = "PENDENTE";
    public static final String ACEITA = "ACEITA";
    public static final String EM_ESPERA = "EM_ESPERA";
    public static final String RECUSADA = "RECUSADA";
    public static final String CANCELADA = "CANCELADA";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @JsonIgnoreProperties({"fotos", "hibernateLazyInitializer", "handler"})
    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "imovel_id", nullable = false)
    private ImovelModel imovel;

    // nunca devolver a senha no JSON
    @JsonIgnoreProperties({"senha"})
    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private UserModel usuario;

    // ALUGUEL ou VENDA
    @Column(nullable = false)
    private String tipo;

    @Column(name = "valor_proposto", precision = 15, scale = 2, nullable = false)
    private BigDecimal valorProposto;

    @Column(columnDefinition = "text")
    private String mensagem;

    @Column(nullable = false)
    private String status;

    @Column(name = "data_criacao", nullable = false)
    private LocalDateTime dataCriacao;

    // Só na resposta de aceitar/recusar (não vai para o banco): o cliente foi avisado por e-mail?
    @Transient
    private Boolean emailEnviado;
}
