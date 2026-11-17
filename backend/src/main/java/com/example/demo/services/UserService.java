package com.example.demo.services;

import java.util.List;
import java.util.Optional;
import java.util.regex.Pattern;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.DTOs.UserDTO;
import com.example.demo.exceptions.RecursoNaoEncontradoException;
import com.example.demo.exceptions.RegraNegocioException;
import com.example.demo.exceptions.RequisicaoInvalidaException;
import com.example.demo.models.UserModel;
import com.example.demo.repositories.FavoritoRepository;
import com.example.demo.repositories.OfertaRepository;
import com.example.demo.repositories.UserRepository;

@Service
public class UserService {
    // perfis aceitos: ADMIN, CORRETOR e USER (o cliente)
    public static final List<String> PERFIS = List.of("ADMIN", "CORRETOR", "USER");
    private static final Pattern EMAIL = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");
    private static final int SENHA_MINIMA = 3;

    @Autowired
    private UserRepository repository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private OfertaRepository ofertaRepository;

    @Autowired
    private FavoritoRepository favoritoRepository;

    public List<UserModel> getAllUsers() {
        List<UserModel> lista = repository.findAll();
        return lista;
    }

    // Busca por nome ou e-mail, sem diferenciar maiúsculas de minúsculas. Sem termo, devolve todos.
    public List<UserModel> buscar(String busca) {
        List<UserModel> todos = repository.findAll();
        if (busca == null || busca.isBlank()) {
            return todos;
        }
        String termo = busca.trim().toLowerCase();
        return todos.stream()
                .filter(u -> contem(u.getNome(), termo) || contem(u.getEmail(), termo))
                .toList();
    }

    private boolean contem(String texto, String termo) {
        return texto != null && texto.toLowerCase().contains(termo);
    }

    public UserModel find(Integer id) {
        Optional<UserModel> user = repository.findById(id);
        return user.orElse(null);
    }

    public UserModel insert(UserModel user) {
        return repository.save(user);
    }

    public UserModel update(UserModel user) {
        try{
            UserModel usuario = find(user.getId());

            if (usuario == null) {
                return null;
            }

            else{
                if  (user.getNome() != null) {
                    usuario.setNome(user.getNome());
                }
                if  (user.getEmail() != null) {
                    usuario.setEmail(user.getEmail());
                }
                if  (user.getSenha() != null) {
                    usuario.setSenha(passwordEncoder.encode(user.getSenha()));
                }
                return repository.save(usuario);
            }
        }
        catch (Exception e) {
            return null;
        }
    }

    // Excluir (admin). Regras: ninguém exclui a si mesmo; quem tem ofertas fica (o histórico
    // das ofertas depende do usuário); os favoritos vão junto.
    @Transactional
    public void delete(Integer id, String emailLogado) {
        UserModel usuario = find(id);
        if (usuario == null) {
            throw new RecursoNaoEncontradoException("Usuário não encontrado.");
        }
        if (usuario.getEmail() != null && usuario.getEmail().equalsIgnoreCase(emailLogado)) {
            throw new RegraNegocioException("Você não pode excluir o seu próprio usuário.");
        }
        if (ofertaRepository.existsByUsuarioId(id)) {
            throw new RegraNegocioException("Este usuário tem ofertas registradas e não pode ser excluído.");
        }
        favoritoRepository.deleteByUsuarioId(id);
        repository.delete(usuario);
    }

    public UserModel insert(UserDTO dto) {
        String nome = nomeValido(dto.getNome());
        String email = emailValido(dto.getEmail());
        if (dto.getSenha() == null || dto.getSenha().length() < SENHA_MINIMA) {
            throw new RequisicaoInvalidaException("A senha deve ter pelo menos " + SENHA_MINIMA + " caracteres.");
        }
        String tipo = perfilValido(dto.getTipo() == null || dto.getTipo().isBlank() ? "USER" : dto.getTipo());
        if (repository.findByEmail(email).isPresent()) {
            throw new RegraNegocioException("Já existe um usuário com este e-mail.");
        }

        UserModel model = new UserModel();
        model.setNome(nome);
        model.setEmail(email);
        model.setTipo(tipo);
        // a senha é salva criptografada (BCrypt), senão o login não funciona
        model.setSenha(passwordEncoder.encode(dto.getSenha()));
        return repository.save(model);
    }

    // Editar (admin): troca nome, e-mail e perfil; a senha só muda se vier preenchida.
    public UserModel update(UserDTO dto) {
        UserModel model = find(dto.getId());
        if (model == null) {
            return null;
        }
        String nome = nomeValido(dto.getNome());
        String email = emailValido(dto.getEmail());
        String tipo = perfilValido(dto.getTipo() == null || dto.getTipo().isBlank() ? model.getTipo() : dto.getTipo());
        Optional<UserModel> mesmoEmail = repository.findByEmail(email);
        if (mesmoEmail.isPresent() && !mesmoEmail.get().getId().equals(model.getId())) {
            throw new RegraNegocioException("Já existe um usuário com este e-mail.");
        }
        if (dto.getSenha() != null && !dto.getSenha().isBlank() && dto.getSenha().length() < SENHA_MINIMA) {
            throw new RequisicaoInvalidaException("A senha deve ter pelo menos " + SENHA_MINIMA + " caracteres.");
        }

        model.setNome(nome);
        model.setEmail(email);
        model.setTipo(tipo);
        if (dto.getSenha() != null && !dto.getSenha().isBlank()) {
            model.setSenha(passwordEncoder.encode(dto.getSenha()));
        }
        return repository.save(model);
    }

    private String nomeValido(String nome) {
        if (nome == null || nome.isBlank()) {
            throw new RequisicaoInvalidaException("Informe o nome.");
        }
        return nome.trim();
    }

    private String emailValido(String email) {
        if (email == null || !EMAIL.matcher(email.trim()).matches()) {
            throw new RequisicaoInvalidaException("Informe um e-mail válido.");
        }
        return email.trim();
    }

    private String perfilValido(String tipo) {
        String perfil = tipo.trim().toUpperCase();
        if (!PERFIS.contains(perfil)) {
            throw new RequisicaoInvalidaException("Perfil inválido. Use ADMIN, CORRETOR ou USER.");
        }
        return perfil;
    }
}
