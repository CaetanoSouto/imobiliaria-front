package com.example.demo;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.example.demo.DTOs.OfertaRequestDTO;
import com.example.demo.exceptions.AcessoProibidoException;
import com.example.demo.exceptions.RegraNegocioException;
import com.example.demo.exceptions.RequisicaoInvalidaException;
import com.example.demo.models.ContratoModel;
import com.example.demo.models.ImovelModel;
import com.example.demo.models.OfertaModel;
import com.example.demo.models.UserModel;
import com.example.demo.repositories.ContratoRepository;
import com.example.demo.repositories.ImovelRepository;
import com.example.demo.repositories.OfertaRepository;
import com.example.demo.repositories.UserRepository;
import com.example.demo.services.ContratoPdfService;
import com.example.demo.services.ContratoService;
import com.example.demo.services.EmailRenderer;
import com.example.demo.services.EmailService;
import com.example.demo.services.NotificacaoService;
import com.example.demo.services.OfertaService;

// Regras de negócio do fluxo: oferta -> corretor aceita e prepara o contrato ->
// admin aprova -> cliente assina. Usa repositórios simulados (sem banco).
class FluxoContratoTest {

    private OfertaRepository ofertaRepo;
    private ImovelRepository imovelRepo;
    private UserRepository userRepo;
    private ContratoRepository contratoRepo;
    private OfertaService ofertas;
    private ContratoService contratos;
    private ContratoPdfService pdfService;
    private EmailService emailService;

    private UserModel cliente;
    private ImovelModel imovel;
    private final List<OfertaModel> ofertasDoImovel = new ArrayList<>();

    @BeforeEach
    void preparar() {
        ofertaRepo = mock(OfertaRepository.class);
        imovelRepo = mock(ImovelRepository.class);
        userRepo = mock(UserRepository.class);
        contratoRepo = mock(ContratoRepository.class);
        pdfService = mock(ContratoPdfService.class);
        emailService = mock(EmailService.class);
        // o HTML do e-mail tem teste proprio (EmailsTest); aqui o gerador é simulado
        EmailRenderer renderer = mock(EmailRenderer.class);
        when(renderer.html(any())).thenReturn("<p>html</p>");
        when(renderer.texto(any())).thenReturn("texto");
        NotificacaoService notificacao = new NotificacaoService(emailService, renderer);
        when(pdfService.gerar(any(ContratoModel.class))).thenReturn(new byte[] { 1, 2, 3 });
        ofertas = new OfertaService(ofertaRepo, imovelRepo, userRepo, contratoRepo, notificacao);
        contratos = new ContratoService(contratoRepo, ofertaRepo, imovelRepo, userRepo, pdfService, notificacao);

        cliente = usuario(1, "cliente@email.com");
        imovel = new ImovelModel();
        imovel.setId(10);
        imovel.setTitulo("Casa de teste");
        imovel.setFinalidade("VENDA");
        imovel.setStatus("DISPONIVEL");

        when(userRepo.findByEmail("cliente@email.com")).thenReturn(Optional.of(cliente));
        when(imovelRepo.findById(10)).thenReturn(Optional.of(imovel));
        when(ofertaRepo.findByImovelId(10)).thenReturn(ofertasDoImovel);
        when(ofertaRepo.save(any(OfertaModel.class))).thenAnswer(i -> i.getArgument(0));
        when(contratoRepo.save(any(ContratoModel.class))).thenAnswer(i -> i.getArgument(0));
    }

    // ---------- helpers ----------
    private UserModel usuario(int id, String email) {
        UserModel u = new UserModel();
        u.setId(id);
        u.setEmail(email);
        return u;
    }

    private OfertaRequestDTO dto(String tipo, String valor) {
        OfertaRequestDTO d = new OfertaRequestDTO();
        d.setImovelId(10);
        d.setTipo(tipo);
        d.setValorProposto(valor == null ? null : new BigDecimal(valor));
        return d;
    }

    private OfertaModel oferta(int id, UserModel dono, String status) {
        OfertaModel o = new OfertaModel();
        o.setId(id);
        o.setImovel(imovel);
        o.setUsuario(dono);
        o.setTipo("VENDA");
        o.setValorProposto(new BigDecimal("300000"));
        o.setStatus(status);
        ofertasDoImovel.add(o);
        when(ofertaRepo.findById(id)).thenReturn(Optional.of(o));
        return o;
    }

    private ContratoModel contrato(int id, OfertaModel o, String status) {
        ContratoModel c = new ContratoModel();
        c.setId(id);
        c.setOferta(o);
        c.setStatus(status);
        when(contratoRepo.findById(id)).thenReturn(Optional.of(c));
        return c;
    }

    // ---------- enviar oferta ----------
    @Test
    void clienteEnviaOfertaPendente() {
        OfertaModel o = ofertas.criar("cliente@email.com", dto("venda", "250000"));
        assertEquals(OfertaModel.PENDENTE, o.getStatus());
        assertEquals("VENDA", o.getTipo());
        assertNotNull(o.getDataCriacao());
    }

    @Test
    void ofertaComValorZeroOuAusenteEhRejeitada() {
        assertThrows(RequisicaoInvalidaException.class, () -> ofertas.criar("cliente@email.com", dto("VENDA", "0")));
        assertThrows(RequisicaoInvalidaException.class, () -> ofertas.criar("cliente@email.com", dto("VENDA", null)));
    }

    @Test
    void ofertaComTipoInvalidoEhRejeitada() {
        assertThrows(RequisicaoInvalidaException.class, () -> ofertas.criar("cliente@email.com", dto("TROCA", "100")));
    }

    @Test
    void tipoDaOfertaPrecisaCombinarComAFinalidadeDoImovel() {
        assertThrows(RegraNegocioException.class, () -> ofertas.criar("cliente@email.com", dto("ALUGUEL", "1500")));
    }

    @Test
    void imovelIndisponivelNaoRecebeOferta() {
        imovel.setStatus("RESERVADO");
        assertThrows(RegraNegocioException.class, () -> ofertas.criar("cliente@email.com", dto("VENDA", "250000")));
        verify(ofertaRepo, never()).save(any());
    }

    @Test
    void clienteNaoPodeTerDuasOfertasPendentesParaOMesmoImovel() {
        when(ofertaRepo.existsByUsuarioIdAndImovelIdAndStatus(1, 10, OfertaModel.PENDENTE)).thenReturn(true);
        assertThrows(RegraNegocioException.class, () -> ofertas.criar("cliente@email.com", dto("VENDA", "250000")));
    }

    // ---------- corretor aceita e prepara o contrato ----------
    @Test
    void aceitarOfertaPreparaContratoAguardandoAprovacaoEReservaOImovel() {
        OfertaModel escolhida = oferta(1, cliente, OfertaModel.PENDENTE);
        OfertaModel outra = oferta(2, usuario(2, "outro@email.com"), OfertaModel.PENDENTE);

        ofertas.aceitar(1, "  Entrada de 20%  ");

        assertEquals(OfertaModel.ACEITA, escolhida.getStatus());
        assertEquals("RESERVADO", imovel.getStatus());
        assertEquals(OfertaModel.EM_ESPERA, outra.getStatus());

        var captor = org.mockito.ArgumentCaptor.forClass(ContratoModel.class);
        verify(contratoRepo).save(captor.capture());
        ContratoModel criado = captor.getValue();
        assertEquals(ContratoModel.AGUARDANDO_APROVACAO, criado.getStatus());
        assertEquals("Entrada de 20%", criado.getCondicoes());
        assertNotNull(criado.getDataCriacao());
    }

    @Test
    void soOfertaPendentePodeSerAceita() {
        oferta(1, cliente, OfertaModel.RECUSADA);
        assertThrows(RegraNegocioException.class, () -> ofertas.aceitar(1, null));
        verify(contratoRepo, never()).save(any());
    }

    @Test
    void naoAceitaOfertaQuandoOImovelJaEstaReservado() {
        oferta(1, cliente, OfertaModel.PENDENTE);
        imovel.setStatus("RESERVADO");
        assertThrows(RegraNegocioException.class, () -> ofertas.aceitar(1, null));
    }

    @Test
    void corretorPodeRecusarOfertaPendenteMasNaoUmaAceita() {
        OfertaModel pendente = oferta(1, cliente, OfertaModel.PENDENTE);
        ofertas.recusar(1);
        assertEquals(OfertaModel.RECUSADA, pendente.getStatus());

        oferta(3, cliente, OfertaModel.ACEITA);
        assertThrows(RegraNegocioException.class, () -> ofertas.recusar(3));
    }

    @Test
    void clienteNaoCancelaOfertaDeOutroUsuario() {
        oferta(1, usuario(2, "outro@email.com"), OfertaModel.PENDENTE);
        assertThrows(AcessoProibidoException.class, () -> ofertas.cancelar(1, "cliente@email.com"));
    }

    // ---------- admin aprova ----------
    @Test
    void adminAprovaContratoELiberaParaAssinatura() {
        ContratoModel c = contrato(5, oferta(1, cliente, OfertaModel.ACEITA), ContratoModel.AGUARDANDO_APROVACAO);

        contratos.aprovar(5);

        assertEquals(ContratoModel.AGUARDANDO_ASSINATURA, c.getStatus());
        assertNotNull(c.getDataAprovacao());
    }

    @Test
    void aprovarGeraOPdfEEnviaPorEmailQuandoOSmtpEstaConfigurado() throws Exception {
        when(emailService.configurado()).thenReturn(true);
        ContratoModel c = contrato(5, oferta(1, cliente, OfertaModel.ACEITA), ContratoModel.AGUARDANDO_APROVACAO);
        cliente.setEmail("cliente@email.com");

        contratos.aprovar(5);

        verify(pdfService).gerar(c);
        verify(emailService).enviarHtml(eq("cliente@email.com"), any(), any(), any(), eq("contrato-5.pdf"), any());
        assertEquals(Boolean.TRUE, c.getEmailEnviado());
    }

    @Test
    void aprovarFuncionaMesmoSemSmtpConfiguradoEAvisaQueNaoEnviou() throws Exception {
        when(emailService.configurado()).thenReturn(false);
        ContratoModel c = contrato(5, oferta(1, cliente, OfertaModel.ACEITA), ContratoModel.AGUARDANDO_APROVACAO);

        contratos.aprovar(5);

        assertEquals(ContratoModel.AGUARDANDO_ASSINATURA, c.getStatus());
        assertEquals(Boolean.FALSE, c.getEmailEnviado());
        verify(emailService, never()).enviarHtml(any(), any(), any(), any(), any(), any());
    }

    @Test
    void falhaNoEnvioDoEmailNaoImpedeAAprovacao() throws Exception {
        when(emailService.configurado()).thenReturn(true);
        doThrow(new RuntimeException("SMTP fora do ar")).when(emailService).enviarHtml(any(), any(), any(), any(), any(), any());
        ContratoModel c = contrato(5, oferta(1, cliente, OfertaModel.ACEITA), ContratoModel.AGUARDANDO_APROVACAO);

        contratos.aprovar(5);

        assertEquals(ContratoModel.AGUARDANDO_ASSINATURA, c.getStatus());
        assertEquals(Boolean.FALSE, c.getEmailEnviado());
    }

    @Test
    void cancelarAvisaOClientePorEmail() throws Exception {
        when(emailService.configurado()).thenReturn(true);
        ContratoModel c = contrato(5, oferta(1, cliente, OfertaModel.ACEITA), ContratoModel.AGUARDANDO_APROVACAO);
        cliente.setEmail("cliente@email.com");

        contratos.cancelar(5);

        verify(emailService).enviarHtml(eq("cliente@email.com"), any(), any(), any(), any(), any());
        assertEquals(Boolean.TRUE, c.getEmailEnviado());
    }

    // ---------- avisos por e-mail ao cliente ----------
    @Test
    void aceitarAvisaOClientePorEmail() throws Exception {
        when(emailService.configurado()).thenReturn(true);
        cliente.setNome("Cliente");
        OfertaModel o = oferta(1, cliente, OfertaModel.PENDENTE);

        ofertas.aceitar(1, null);

        verify(emailService).enviarHtml(eq("cliente@email.com"), eq("Sua oferta foi aceita - Casa de teste"), any(), any(), any(), any());
        assertEquals(Boolean.TRUE, o.getEmailEnviado());
    }

    @Test
    void recusarAvisaOClientePorEmail() throws Exception {
        when(emailService.configurado()).thenReturn(true);
        cliente.setNome("Cliente");
        OfertaModel o = oferta(1, cliente, OfertaModel.PENDENTE);

        ofertas.recusar(1);

        verify(emailService).enviarHtml(eq("cliente@email.com"), eq("Sua oferta foi recusada - Casa de teste"), any(), any(), any(), any());
        assertEquals(Boolean.TRUE, o.getEmailEnviado());
    }

    @Test
    void aceitarFuncionaSemSmtpEAvisaQueNaoEnviou() throws Exception {
        when(emailService.configurado()).thenReturn(false);
        OfertaModel o = oferta(1, cliente, OfertaModel.PENDENTE);

        ofertas.aceitar(1, null);

        assertEquals(OfertaModel.ACEITA, o.getStatus());
        assertEquals(Boolean.FALSE, o.getEmailEnviado());
        verify(emailService, never()).enviarHtml(any(), any(), any(), any(), any(), any());
    }

    @Test
    void falhaNoEmailNaoImpedeARecusa() throws Exception {
        when(emailService.configurado()).thenReturn(true);
        doThrow(new RuntimeException("SMTP fora do ar")).when(emailService).enviarHtml(any(), any(), any(), any(), any(), any());
        OfertaModel o = oferta(1, cliente, OfertaModel.PENDENTE);

        ofertas.recusar(1);

        assertEquals(OfertaModel.RECUSADA, o.getStatus());
        assertEquals(Boolean.FALSE, o.getEmailEnviado());
    }

    @Test
    void ofertaRecusadaPorEstadoInvalidoNaoEnviaEmail() throws Exception {
        when(emailService.configurado()).thenReturn(true);
        oferta(1, cliente, OfertaModel.ACEITA);

        assertThrows(RegraNegocioException.class, () -> ofertas.recusar(1));

        verify(emailService, never()).enviarHtml(any(), any(), any(), any(), any(), any());
    }

    @Test
    void assinarConfirmaAoClienteComOPdfEmAnexo() throws Exception {
        when(emailService.configurado()).thenReturn(true);
        cliente.setNome("Cliente");
        ContratoModel c = contrato(5, oferta(1, cliente, OfertaModel.ACEITA), ContratoModel.AGUARDANDO_ASSINATURA);

        contratos.assinar(5, "cliente@email.com");

        verify(emailService).enviarHtml(eq("cliente@email.com"), eq("Contrato assinado - Casa de teste"),
                any(), any(), eq("contrato-5.pdf"), any());
        assertEquals(Boolean.TRUE, c.getEmailEnviado());
    }

    @Test
    void assinarFuncionaSemSmtpEAvisaQueNaoEnviou() throws Exception {
        when(emailService.configurado()).thenReturn(false);
        ContratoModel c = contrato(5, oferta(1, cliente, OfertaModel.ACEITA), ContratoModel.AGUARDANDO_ASSINATURA);

        contratos.assinar(5, "cliente@email.com");

        assertEquals(ContratoModel.ASSINADO, c.getStatus());
        assertEquals(Boolean.FALSE, c.getEmailEnviado());
        verify(emailService, never()).enviarHtml(any(), any(), any(), any(), any(), any());
    }

    @Test
    void assinarTentativaInvalidaNaoEnviaEmail() throws Exception {
        when(emailService.configurado()).thenReturn(true);
        contrato(5, oferta(1, cliente, OfertaModel.ACEITA), ContratoModel.AGUARDANDO_APROVACAO);

        assertThrows(RegraNegocioException.class, () -> contratos.assinar(5, "cliente@email.com"));

        verify(emailService, never()).enviarHtml(any(), any(), any(), any(), any(), any());
    }

    // ---------- PDF ----------
    @Test
    void funcionarioBaixaOPdfDeQualquerContrato() {
        contrato(5, oferta(1, usuario(2, "outro@email.com"), OfertaModel.ACEITA), ContratoModel.AGUARDANDO_APROVACAO);
        assertNotNull(contratos.pdf(5, "admin@email.com", true));
    }

    @Test
    void clienteBaixaOPdfDoProprioContratoDepoisDeAprovado() {
        cliente.setEmail("cliente@email.com");
        contrato(5, oferta(1, cliente, OfertaModel.ACEITA), ContratoModel.AGUARDANDO_ASSINATURA);
        assertNotNull(contratos.pdf(5, "cliente@email.com", false));
    }

    @Test
    void clienteNaoBaixaOPdfAntesDaAprovacao() {
        cliente.setEmail("cliente@email.com");
        contrato(5, oferta(1, cliente, OfertaModel.ACEITA), ContratoModel.AGUARDANDO_APROVACAO);
        assertThrows(RegraNegocioException.class, () -> contratos.pdf(5, "cliente@email.com", false));
    }

    @Test
    void clienteNaoBaixaOPdfDeOutroUsuario() {
        contrato(5, oferta(1, usuario(2, "outro@email.com"), OfertaModel.ACEITA), ContratoModel.AGUARDANDO_ASSINATURA);
        assertThrows(AcessoProibidoException.class, () -> contratos.pdf(5, "cliente@email.com", false));
    }

    @Test
    void soContratoAguardandoAprovacaoPodeSerAprovado() {
        contrato(5, oferta(1, cliente, OfertaModel.ACEITA), ContratoModel.AGUARDANDO_ASSINATURA);
        assertThrows(RegraNegocioException.class, () -> contratos.aprovar(5));
    }

    // ---------- cliente assina ----------
    @Test
    void clienteNaoAssinaContratoQueAindaNaoFoiAprovado() {
        ContratoModel c = contrato(5, oferta(1, cliente, OfertaModel.ACEITA), ContratoModel.AGUARDANDO_APROVACAO);

        assertThrows(RegraNegocioException.class, () -> contratos.assinar(5, "cliente@email.com"));
        assertEquals(ContratoModel.AGUARDANDO_APROVACAO, c.getStatus());
    }

    @Test
    void clienteNaoAssinaContratoDeOutroUsuario() {
        contrato(5, oferta(1, usuario(2, "outro@email.com"), OfertaModel.ACEITA), ContratoModel.AGUARDANDO_ASSINATURA);
        assertThrows(AcessoProibidoException.class, () -> contratos.assinar(5, "cliente@email.com"));
    }

    @Test
    void assinarVendeOImovelERecusaAsOutrasOfertas() {
        OfertaModel aceita = oferta(1, cliente, OfertaModel.ACEITA);
        OfertaModel espera = oferta(2, usuario(2, "outro@email.com"), OfertaModel.EM_ESPERA);
        ContratoModel c = contrato(5, aceita, ContratoModel.AGUARDANDO_ASSINATURA);

        contratos.assinar(5, "cliente@email.com");

        assertEquals(ContratoModel.ASSINADO, c.getStatus());
        assertNotNull(c.getDataAssinatura());
        assertEquals("VENDIDO", imovel.getStatus());
        assertEquals(OfertaModel.RECUSADA, espera.getStatus());
    }

    @Test
    void assinarContratoDeAluguelMarcaOImovelComoAlugado() {
        OfertaModel aceita = oferta(1, cliente, OfertaModel.ACEITA);
        aceita.setTipo("ALUGUEL");
        contrato(5, aceita, ContratoModel.AGUARDANDO_ASSINATURA);

        contratos.assinar(5, "cliente@email.com");

        assertEquals("ALUGADO", imovel.getStatus());
    }

    @Test
    void naoAssinaDuasVezes() {
        contrato(5, oferta(1, cliente, OfertaModel.ACEITA), ContratoModel.ASSINADO);
        assertThrows(RegraNegocioException.class, () -> contratos.assinar(5, "cliente@email.com"));
    }

    // ---------- admin reprova/cancela ----------
    @Test
    void cancelarLiberaOImovelEReativaAsOfertasEmEspera() {
        OfertaModel aceita = oferta(1, cliente, OfertaModel.ACEITA);
        OfertaModel espera = oferta(2, usuario(2, "outro@email.com"), OfertaModel.EM_ESPERA);
        imovel.setStatus("RESERVADO");
        ContratoModel c = contrato(5, aceita, ContratoModel.AGUARDANDO_APROVACAO);

        contratos.cancelar(5);

        assertEquals(ContratoModel.CANCELADO, c.getStatus());
        assertEquals(OfertaModel.CANCELADA, aceita.getStatus());
        assertEquals("DISPONIVEL", imovel.getStatus());
        assertEquals(OfertaModel.PENDENTE, espera.getStatus());
    }

    @Test
    void naoCancelaContratoJaCancelado() {
        contrato(5, oferta(1, cliente, OfertaModel.CANCELADA), ContratoModel.CANCELADO);
        assertThrows(RegraNegocioException.class, () -> contratos.cancelar(5));
    }
}
