package com.example.demo;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import com.example.demo.DTOs.UserDTO;
import com.example.demo.exceptions.RecursoNaoEncontradoException;
import com.example.demo.exceptions.RegraNegocioException;
import com.example.demo.exceptions.RequisicaoInvalidaException;
import com.example.demo.models.BairroModel;
import com.example.demo.models.ImovelModel;
import com.example.demo.models.TipoImovelModel;
import com.example.demo.models.UserModel;
import com.example.demo.repositories.FavoritoRepository;
import com.example.demo.repositories.ImovelRepository;
import com.example.demo.repositories.OfertaRepository;
import com.example.demo.repositories.UserRepository;
import com.example.demo.services.FotoImovelService;
import com.example.demo.services.ImovelService;
import com.example.demo.services.UserService;

// Regras do admin: gestão de usuários (busca, perfil, e-mail único, não excluir a si mesmo)
// e de imóveis (campos obrigatórios, preço coerente com a finalidade, exclusão protegida).
class RegrasAdminTest {

    private UserRepository userRepo;
    private OfertaRepository ofertaRepo;
    private FavoritoRepository favoritoRepo;
    private UserService usuarios;

    private ImovelRepository imovelRepo;
    private FotoImovelService fotoService;
    private ImovelService imoveis;

    @BeforeEach
    void preparar() {
        userRepo = mock(UserRepository.class);
        ofertaRepo = mock(OfertaRepository.class);
        favoritoRepo = mock(FavoritoRepository.class);
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        when(encoder.encode(any())).thenAnswer(i -> "hash-" + i.getArgument(0));
        when(userRepo.save(any(UserModel.class))).thenAnswer(i -> i.getArgument(0));

        usuarios = new UserService();
        ReflectionTestUtils.setField(usuarios, "repository", userRepo);
        ReflectionTestUtils.setField(usuarios, "passwordEncoder", encoder);
        ReflectionTestUtils.setField(usuarios, "ofertaRepository", ofertaRepo);
        ReflectionTestUtils.setField(usuarios, "favoritoRepository", favoritoRepo);

        imovelRepo = mock(ImovelRepository.class);
        fotoService = mock(FotoImovelService.class);
        when(imovelRepo.save(any(ImovelModel.class))).thenAnswer(i -> i.getArgument(0));
        imoveis = new ImovelService(imovelRepo, ofertaRepo, favoritoRepo, fotoService);
    }

    private UserModel usuario(int id, String nome, String email, String tipo) {
        UserModel u = new UserModel();
        u.setId(id);
        u.setNome(nome);
        u.setEmail(email);
        u.setTipo(tipo);
        return u;
    }

    private UserDTO dto(String nome, String email, String senha, String tipo) {
        UserDTO d = new UserDTO();
        d.setNome(nome);
        d.setEmail(email);
        d.setSenha(senha);
        d.setTipo(tipo);
        return d;
    }

    // ---------- usuários ----------
    @Test
    void buscaPorNomeOuEmailSemDiferenciarMaiusculas() {
        when(userRepo.findAll()).thenReturn(List.of(
                usuario(1, "Maria Souza", "maria@email.com", "USER"),
                usuario(2, "João", "joao@loja.com", "USER"),
                usuario(3, "Admin", "admin@email.com", "ADMIN")));

        assertEquals(1, usuarios.buscar("SOUZA").size());
        assertEquals(1, usuarios.buscar("loja.com").size());
        assertEquals(2, usuarios.buscar("@email.com").size());
        assertEquals(3, usuarios.buscar("  ").size());
        assertEquals(0, usuarios.buscar("xyz").size());
    }

    @Test
    void cadastraUsuarioComSenhaCriptografadaEPerfilPadraoUser() {
        UserModel salvo = usuarios.insert(dto(" Ana ", "ana@email.com", "abc", null));
        assertEquals("Ana", salvo.getNome());
        assertEquals("USER", salvo.getTipo());
        assertEquals("hash-abc", salvo.getSenha());
    }

    @Test
    void cadastroValidaNomeEmailSenhaEPerfil() {
        assertThrows(RequisicaoInvalidaException.class, () -> usuarios.insert(dto("", "a@a.com", "123", "USER")));
        assertThrows(RequisicaoInvalidaException.class, () -> usuarios.insert(dto("Ana", "sem-arroba", "123", "USER")));
        assertThrows(RequisicaoInvalidaException.class, () -> usuarios.insert(dto("Ana", "a@a.com", "12", "USER")));
        assertThrows(RequisicaoInvalidaException.class, () -> usuarios.insert(dto("Ana", "a@a.com", "123", "DONO")));
        verify(userRepo, never()).save(any());
    }

    @Test
    void naoCadastraEmailRepetido() {
        when(userRepo.findByEmail("ana@email.com")).thenReturn(Optional.of(usuario(9, "Outra", "ana@email.com", "USER")));
        assertThrows(RegraNegocioException.class, () -> usuarios.insert(dto("Ana", "ana@email.com", "123", "USER")));
    }

    @Test
    void adminTrocaOPerfilDeUmUsuarioSemMudarASenha() {
        UserModel existente = usuario(4, "Beto", "beto@email.com", "USER");
        existente.setSenha("hash-antigo");
        when(userRepo.findById(4)).thenReturn(Optional.of(existente));
        UserDTO d = dto("Beto", "beto@email.com", null, "CORRETOR");
        d.setId(4);

        UserModel salvo = usuarios.update(d);

        assertEquals("CORRETOR", salvo.getTipo());
        assertEquals("hash-antigo", salvo.getSenha());
    }

    @Test
    void naoTrocaParaEmailDeOutroUsuario() {
        UserModel existente = usuario(4, "Beto", "beto@email.com", "USER");
        when(userRepo.findById(4)).thenReturn(Optional.of(existente));
        when(userRepo.findByEmail("maria@email.com")).thenReturn(Optional.of(usuario(1, "Maria", "maria@email.com", "USER")));
        UserDTO d = dto("Beto", "maria@email.com", null, "USER");
        d.setId(4);

        assertThrows(RegraNegocioException.class, () -> usuarios.update(d));
    }

    @Test
    void adminNaoPodeExcluirASiMesmo() {
        when(userRepo.findById(1)).thenReturn(Optional.of(usuario(1, "Admin", "admin@email.com", "ADMIN")));

        assertThrows(RegraNegocioException.class, () -> usuarios.delete(1, "admin@email.com"));
        assertThrows(RegraNegocioException.class, () -> usuarios.delete(1, "ADMIN@email.com"));
        verify(userRepo, never()).delete(any(UserModel.class));
    }

    @Test
    void usuarioComOfertasNaoPodeSerExcluido() {
        when(userRepo.findById(2)).thenReturn(Optional.of(usuario(2, "Cliente", "cliente@email.com", "USER")));
        when(ofertaRepo.existsByUsuarioId(2)).thenReturn(true);

        assertThrows(RegraNegocioException.class, () -> usuarios.delete(2, "admin@email.com"));
        verify(userRepo, never()).delete(any(UserModel.class));
    }

    @Test
    void excluiUsuarioSemOfertasERemoveSeusFavoritos() {
        UserModel alvo = usuario(2, "Cliente", "cliente@email.com", "USER");
        when(userRepo.findById(2)).thenReturn(Optional.of(alvo));

        usuarios.delete(2, "admin@email.com");

        verify(favoritoRepo).deleteByUsuarioId(2);
        verify(userRepo).delete(alvo);
    }

    @Test
    void excluirUsuarioInexistenteDa404() {
        when(userRepo.findById(99)).thenReturn(Optional.empty());
        assertThrows(RecursoNaoEncontradoException.class, () -> usuarios.delete(99, "admin@email.com"));
    }

    // ---------- imóveis ----------
    private ImovelModel imovelValido(String finalidade) {
        ImovelModel i = new ImovelModel();
        i.setTitulo("Casa nova");
        i.setFinalidade(finalidade);
        if (finalidade.equalsIgnoreCase("VENDA")) {
            i.setPrecoVenda(new BigDecimal("300000"));
        } else {
            i.setPrecoAluguel(new BigDecimal("1500"));
        }
        TipoImovelModel tipo = new TipoImovelModel();
        tipo.setId(1);
        i.setTipoImovel(tipo);
        BairroModel bairro = new BairroModel();
        bairro.setId(1);
        i.setBairro(bairro);
        return i;
    }

    @Test
    void imovelNovoSemStatusNasceDisponivel() {
        ImovelModel salvo = imoveis.insert(imovelValido("venda"));
        assertEquals("DISPONIVEL", salvo.getStatus());
        assertEquals("VENDA", salvo.getFinalidade());
    }

    @Test
    void imovelExigeTituloFinalidadeTipoEBairro() {
        ImovelModel semTitulo = imovelValido("VENDA");
        semTitulo.setTitulo(" ");
        assertThrows(RequisicaoInvalidaException.class, () -> imoveis.insert(semTitulo));

        ImovelModel finalidadeRuim = imovelValido("VENDA");
        finalidadeRuim.setFinalidade("TROCA");
        assertThrows(RequisicaoInvalidaException.class, () -> imoveis.insert(finalidadeRuim));

        ImovelModel semTipo = imovelValido("VENDA");
        semTipo.setTipoImovel(null);
        assertThrows(RequisicaoInvalidaException.class, () -> imoveis.insert(semTipo));

        ImovelModel semBairro = imovelValido("VENDA");
        semBairro.setBairro(null);
        assertThrows(RequisicaoInvalidaException.class, () -> imoveis.insert(semBairro));
        verify(imovelRepo, never()).save(any());
    }

    @Test
    void precoPrecisaCombinarComAFinalidade() {
        ImovelModel venda = imovelValido("VENDA");
        venda.setPrecoVenda(BigDecimal.ZERO);
        assertThrows(RequisicaoInvalidaException.class, () -> imoveis.insert(venda));

        ImovelModel aluguel = imovelValido("ALUGUEL");
        aluguel.setPrecoAluguel(null);
        assertThrows(RequisicaoInvalidaException.class, () -> imoveis.insert(aluguel));
    }

    @Test
    void situacaoInvalidaEhRejeitada() {
        ImovelModel i = imovelValido("VENDA");
        i.setStatus("EM_OBRAS");
        assertThrows(RequisicaoInvalidaException.class, () -> imoveis.insert(i));
    }

    @Test
    void editarImovelInexistenteDevolveNull() {
        ImovelModel i = imovelValido("VENDA");
        i.setId(77);
        when(imovelRepo.findById(77)).thenReturn(Optional.empty());
        assertEquals(null, imoveis.update(i));
    }

    @Test
    void imovelComOfertasNaoPodeSerExcluido() {
        ImovelModel i = imovelValido("VENDA");
        i.setId(5);
        when(imovelRepo.findById(5)).thenReturn(Optional.of(i));
        when(ofertaRepo.existsByImovelId(5)).thenReturn(true);

        assertThrows(RegraNegocioException.class, () -> imoveis.delete(5));
        verify(imovelRepo, never()).deleteById(any());
    }

    @Test
    void excluirImovelRemoveFotosEFavoritosPrimeiro() {
        ImovelModel i = imovelValido("VENDA");
        i.setId(5);
        when(imovelRepo.findById(5)).thenReturn(Optional.of(i));

        imoveis.delete(5);

        verify(favoritoRepo).deleteByImovelId(5);
        verify(fotoService).excluirDoImovel(5);
        verify(imovelRepo).deleteById(5);
    }

    @Test
    void perfisAceitosSaoAdminCorretorEUser() {
        assertTrue(UserService.PERFIS.containsAll(List.of("ADMIN", "CORRETOR", "USER")));
        assertNotNull(ImovelService.STATUS);
    }
}
