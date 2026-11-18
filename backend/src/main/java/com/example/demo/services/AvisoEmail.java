package com.example.demo.services;

import java.util.List;

import lombok.Getter;

// Conteúdo de um aviso por e-mail ao cliente. O layout (HTML) e a versão em texto simples
// saem daqui, pelo EmailRenderer, então o texto de cada aviso fica escrito uma vez só.
@Getter
public class AvisoEmail {

    // Cor do selo no topo do e-mail (fundo e texto, com contraste suficiente para leitura).
    public enum Tom {
        SUCESSO("#dcfce7", "#166534"),
        INFO("#dbeafe", "#1e40af"),
        ALERTA("#fef3c7", "#92400e"),
        ERRO("#fee2e2", "#991b1b"),
        NEUTRO("#e5e7eb", "#374151");

        private final String fundo;
        private final String texto;

        Tom(String fundo, String texto) {
            this.fundo = fundo;
            this.texto = texto;
        }

        public String getFundo() {
            return fundo;
        }

        public String getTexto() {
            return texto;
        }
    }

    // Uma linha do quadro de dados (ex.: "Imóvel" / "Casa 3 dormitórios").
    @Getter
    public static class Detalhe {
        private final String rotulo;
        private final String valor;

        public Detalhe(String rotulo, String valor) {
            this.rotulo = rotulo;
            this.valor = valor;
        }
    }

    private final String assunto;
    private final Tom tom;
    private final String selo;
    private final String titulo;
    private final String saudacao;
    private final List<String> paragrafos;
    private final List<Detalhe> detalhes;
    private final String botaoTexto;
    private final String botaoCaminho; // caminho dentro do site (ex.: /cliente/contratos); null = sem botão

    public AvisoEmail(String assunto, Tom tom, String selo, String titulo, String saudacao,
            List<String> paragrafos, List<Detalhe> detalhes, String botaoTexto, String botaoCaminho) {
        this.assunto = assunto;
        this.tom = tom;
        this.selo = selo;
        this.titulo = titulo;
        this.saudacao = saudacao;
        this.paragrafos = paragrafos;
        this.detalhes = detalhes;
        this.botaoTexto = botaoTexto;
        this.botaoCaminho = botaoCaminho;
    }

    public String getCorFundo() {
        return tom.getFundo();
    }

    public String getCorTexto() {
        return tom.getTexto();
    }
}
