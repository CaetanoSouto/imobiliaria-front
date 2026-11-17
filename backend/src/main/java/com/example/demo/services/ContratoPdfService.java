package com.example.demo.services;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.text.NumberFormat;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.example.demo.models.ContratoModel;
import com.example.demo.models.ImovelModel;
import com.example.demo.models.OfertaModel;
import com.example.demo.models.UserModel;
import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;

// Gera o PDF do contrato a partir dos dados da oferta aceita.
@Service
public class ContratoPdfService {

    private static final DateTimeFormatter DATA = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    @Value("${app.upload-dir}")
    private String uploadDir;

    public byte[] gerar(ContratoModel contrato) {
        OfertaModel oferta = contrato.getOferta();
        ImovelModel imovel = oferta.getImovel();
        UserModel cliente = oferta.getUsuario();
        boolean venda = "VENDA".equals(oferta.getTipo());

        Font titulo = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18);
        Font secao = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12);
        Font texto = FontFactory.getFont(FontFactory.HELVETICA, 11);
        Font rotulo = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11);

        ByteArrayOutputStream saida = new ByteArrayOutputStream();
        Document documento = new Document(PageSize.A4, 56, 56, 56, 56);
        try {
            PdfWriter.getInstance(documento, saida);
            documento.open();

            Paragraph cabecalho = new Paragraph(
                    venda ? "CONTRATO DE COMPRA E VENDA" : "CONTRATO DE LOCAÇÃO", titulo);
            cabecalho.setAlignment(Element.ALIGN_CENTER);
            documento.add(cabecalho);
            Paragraph numero = new Paragraph("Contrato nº " + contrato.getId(), texto);
            numero.setAlignment(Element.ALIGN_CENTER);
            numero.setSpacingAfter(18);
            documento.add(numero);

            adicionarSecao(documento, "Partes", secao);
            PdfPTable partes = tabela();
            linha(partes, "Cliente", valor(cliente.getNome()), rotulo, texto);
            linha(partes, "E-mail", valor(cliente.getEmail()), rotulo, texto);
            documento.add(partes);

            adicionarSecao(documento, "Imóvel", secao);
            PdfPTable dadosImovel = tabela();
            linha(dadosImovel, "Código", String.valueOf(imovel.getId()), rotulo, texto);
            linha(dadosImovel, "Título", valor(imovel.getTitulo()), rotulo, texto);
            linha(dadosImovel, "Tipo", imovel.getTipoImovel() != null ? valor(imovel.getTipoImovel().getNome()) : "—", rotulo, texto);
            linha(dadosImovel, "Endereço", endereco(imovel), rotulo, texto);
            documento.add(dadosImovel);

            adicionarSecao(documento, "Negócio", secao);
            PdfPTable negocio = tabela();
            linha(negocio, "Modalidade", venda ? "Venda" : "Aluguel", rotulo, texto);
            linha(negocio, "Valor acordado", moeda(oferta.getValorProposto()) + (venda ? "" : " por mês"), rotulo, texto);
            documento.add(negocio);

            adicionarSecao(documento, "Condições", secao);
            documento.add(new Paragraph(
                    contrato.getCondicoes() == null || contrato.getCondicoes().isBlank()
                            ? "Sem condições adicionais."
                            : contrato.getCondicoes(),
                    texto));

            adicionarSecao(documento, "Datas", secao);
            PdfPTable datas = tabela();
            linha(datas, "Preparado em", data(contrato.getDataCriacao()), rotulo, texto);
            linha(datas, "Aprovado em", data(contrato.getDataAprovacao()), rotulo, texto);
            linha(datas, "Assinado em", data(contrato.getDataAssinatura()), rotulo, texto);
            linha(datas, "Situação", situacao(contrato.getStatus()), rotulo, texto);
            documento.add(datas);

            Paragraph assinatura = new Paragraph(
                    "\n\n______________________________________\n" + valor(cliente.getNome()) + "\nAssinatura do cliente",
                    texto);
            assinatura.setAlignment(Element.ALIGN_CENTER);
            assinatura.setSpacingBefore(30);
            documento.add(assinatura);
        } catch (DocumentException e) {
            throw new RuntimeException("Erro ao gerar o PDF do contrato", e);
        } finally {
            if (documento.isOpen()) {
                documento.close();
            }
        }
        return saida.toByteArray();
    }

    // Guarda uma cópia em {app.upload-dir}/contratos e devolve o caminho (ou null se não der para gravar).
    public String gravar(ContratoModel contrato, byte[] pdf) {
        try {
            Path pasta = Paths.get(uploadDir, "contratos");
            Files.createDirectories(pasta);
            Path arquivo = pasta.resolve("contrato-" + contrato.getId() + ".pdf");
            Files.write(arquivo, pdf);
            return arquivo.toString();
        } catch (IOException e) {
            return null;
        }
    }

    private void adicionarSecao(Document documento, String nome, Font fonte) throws DocumentException {
        Paragraph p = new Paragraph(nome, fonte);
        p.setSpacingBefore(14);
        p.setSpacingAfter(6);
        documento.add(p);
    }

    private PdfPTable tabela() throws DocumentException {
        PdfPTable tabela = new PdfPTable(new float[] { 1f, 3f });
        tabela.setWidthPercentage(100);
        return tabela;
    }

    private void linha(PdfPTable tabela, String nome, String conteudo, Font rotulo, Font texto) {
        PdfPCell a = new PdfPCell(new Phrase(nome, rotulo));
        PdfPCell b = new PdfPCell(new Phrase(conteudo, texto));
        a.setBorder(PdfPCell.NO_BORDER);
        b.setBorder(PdfPCell.NO_BORDER);
        a.setPaddingBottom(4);
        b.setPaddingBottom(4);
        tabela.addCell(a);
        tabela.addCell(b);
    }

    private String endereco(ImovelModel imovel) {
        StringBuilder sb = new StringBuilder();
        if (imovel.getEndereco() != null) {
            sb.append(imovel.getEndereco());
            if (imovel.getNumero() != null) {
                sb.append(", ").append(imovel.getNumero());
            }
        }
        if (imovel.getBairro() != null) {
            if (sb.length() > 0) {
                sb.append(" - ");
            }
            sb.append(valor(imovel.getBairro().getNome()));
            if (imovel.getBairro().getCidade() != null) {
                sb.append(", ").append(imovel.getBairro().getCidade());
            }
            if (imovel.getBairro().getEstado() != null) {
                sb.append("/").append(imovel.getBairro().getEstado());
            }
        }
        return sb.length() == 0 ? "—" : sb.toString();
    }

    private String situacao(String status) {
        return switch (status == null ? "" : status) {
            case ContratoModel.AGUARDANDO_APROVACAO -> "Aguardando aprovação";
            case ContratoModel.AGUARDANDO_ASSINATURA -> "Aguardando assinatura";
            case ContratoModel.ASSINADO -> "Assinado";
            case ContratoModel.CANCELADO -> "Cancelado";
            default -> "—";
        };
    }

    private String moeda(java.math.BigDecimal valor) {
        return valor == null ? "—" : NumberFormat.getCurrencyInstance(Locale.forLanguageTag("pt-BR")).format(valor);
    }

    private String data(LocalDateTime data) {
        return data == null ? "—" : DATA.format(data);
    }

    private String valor(String texto) {
        return texto == null || texto.isBlank() ? "—" : texto;
    }
}
