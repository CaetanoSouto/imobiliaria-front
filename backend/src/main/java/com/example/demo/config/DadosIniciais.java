package com.example.demo.config;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.example.demo.models.BairroModel;
import com.example.demo.models.FotoImovelModel;
import com.example.demo.models.ImovelModel;
import com.example.demo.models.TipoImovelModel;
import com.example.demo.models.UserModel;
import com.example.demo.repositories.BairroRepository;
import com.example.demo.repositories.FotoImovelRepository;
import com.example.demo.repositories.ImovelRepository;
import com.example.demo.repositories.TipoImovelRepository;
import com.example.demo.repositories.UserRepository;

// Como só o ADMIN pode cadastrar usuários, o primeiro ADMIN precisa ser criado
// quando a aplicação sobe. Também cria um USER, bairros, tipos e imóveis de exemplo.
// A carga é incremental: só cria o que ainda não existe (por e-mail, nome ou título),
// então dá para acrescentar exemplos novos sem apagar o banco.
@Component
public class DadosIniciais implements CommandLineRunner {

    private final UserRepository userRepository;
    private final ImovelRepository imovelRepository;
    private final BairroRepository bairroRepository;
    private final TipoImovelRepository tipoImovelRepository;
    private final FotoImovelRepository fotoImovelRepository;
    private final PasswordEncoder passwordEncoder;

    private final Map<String, ImovelModel> existentes = new HashMap<>();

    // Fotos de exemplo (Unsplash). C = casa, A = prédio de apartamentos, I = interior,
    // S = sala comercial/escritório, T = terreno.
    private static final String C1 = "1568605114967-8130f3a36994";
    private static final String C2 = "1570129477492-45c003edd2be";
    private static final String C3 = "1564013799919-ab600027ffc6";
    private static final String C4 = "1512917774080-9991f1c4c750";
    private static final String C5 = "1600585154340-be6161a56a0c";
    private static final String C6 = "1600596542815-ffad4c1539a9";
    private static final String C7 = "1605276374104-dee2a0ed3cd6";
    private static final String C8 = "1580587771525-78b9dba3b914";
    private static final String C9 = "1599809275671-b5942cabc7a2";
    private static final String A1 = "1545324418-cc1a3fa10c00";
    private static final String I1 = "1522708323590-d24dbb6b0267";
    private static final String I2 = "1502672260266-1c1ef2d93688";
    private static final String I3 = "1560448204-e02f11c3d0e2";
    private static final String I4 = "1600607687939-ce8a6c25118c";
    private static final String I5 = "1493809842364-78817add7ffb";
    private static final String I6 = "1560185007-cde436f6a4d0";
    private static final String I7 = "1560448075-bb485b067938";
    private static final String S1 = "1497366216548-37526070297c";
    private static final String S2 = "1486406146926-c627a92ad1ab";
    private static final String T1 = "1500382017468-9049fed747ef";

    public DadosIniciais(UserRepository userRepository, ImovelRepository imovelRepository,
            BairroRepository bairroRepository, TipoImovelRepository tipoImovelRepository,
            FotoImovelRepository fotoImovelRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.imovelRepository = imovelRepository;
        this.bairroRepository = bairroRepository;
        this.tipoImovelRepository = tipoImovelRepository;
        this.fotoImovelRepository = fotoImovelRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (userRepository.findByEmail("admin@email.com").isEmpty()) {
            UserModel admin = new UserModel();
            admin.setNome("Administrador");
            admin.setEmail("admin@email.com");
            admin.setSenha(passwordEncoder.encode("123"));
            admin.setTipo("ADMIN");
            userRepository.save(admin);
        }

        if (userRepository.findByEmail("corretor@email.com").isEmpty()) {
            UserModel corretor = new UserModel();
            corretor.setNome("Corretor");
            corretor.setEmail("corretor@email.com");
            corretor.setSenha(passwordEncoder.encode("123"));
            corretor.setTipo("CORRETOR");
            userRepository.save(corretor);
        }

        if (userRepository.findByEmail("user@email.com").isEmpty()) {
            UserModel user = new UserModel();
            user.setNome("Usuario");
            user.setEmail("user@email.com");
            user.setSenha(passwordEncoder.encode("123"));
            user.setTipo("USER");
            userRepository.save(user);
        }

        imovelRepository.findAll().forEach(i -> existentes.put(i.getTitulo(), i));

        BairroModel centro = bairro("Centro", "97010");
        BairroModel camobi = bairro("Camobi", "97105");
        BairroModel nossaSenhora = bairro("Nossa Senhora das Dores", "97050");
        BairroModel menino = bairro("Menino Jesus", "97060");
        BairroModel bonfim = bairro("Bonfim", "97020");
        BairroModel patronato = bairro("Patronato", "97010");
        BairroModel tomazetti = bairro("Tomazetti", "97040");

        TipoImovelModel casa = tipo("Casa", "Casas residenciais");
        TipoImovelModel apto = tipo("Apartamento", "Apartamentos e kitnets");
        TipoImovelModel terreno = tipo("Terreno", "Lotes e terrenos");
        TipoImovelModel comercial = tipo("Sala comercial", "Salas e lojas");
        TipoImovelModel cobertura = tipo("Cobertura", "Coberturas e duplex");
        TipoImovelModel galpao = tipo("Galpão", "Galpões e depósitos");

        // ---- Exemplos originais ----
        criar("Casa 3 dormitórios", "Casa de exemplo com pátio amplo e churrasqueira.", casa, camobi,
                "VENDA", "350000.00", null, "DISPONIVEL", 3, 2, 2, "180.00", "Rua das Flores", "100", C7, I3);
        criar("Apartamento aconchegante no centro", "Apartamento reformado, próximo ao comércio e ao transporte.",
                apto, centro, "ALUGUEL", null, "1500.00", "DISPONIVEL", 2, 1, 1, "68.00", "Av. Rio Branco", "850", A1, I1, I5);
        criar("Cobertura com vista", "Cobertura duplex com terraço e vista panorâmica da cidade.", apto, centro,
                "VENDA", "890000.00", null, "DISPONIVEL", 3, 3, 2, "210.00", "Rua do Acampamento", "300", C6, I4, I6);
        criar("Casa para alugar em Camobi", "Casa próxima à universidade, ideal para família.", casa, camobi,
                "ALUGUEL", null, "2300.00", "DISPONIVEL", 3, 2, 1, "120.00", "Rua Alberto Pasqualini", "45", C2, I6);
        criar("Terreno plano 360 m²", "Terreno plano, documentação em dia, pronto para construir.", terreno, menino,
                "VENDA", "180000.00", null, "DISPONIVEL", null, null, null, "360.00", "Rua Venâncio Aires", "s/n", T1);
        criar("Sala comercial térrea", "Sala com vitrine, banheiro e ótima circulação de pessoas.", comercial, centro,
                "ALUGUEL", null, "2800.00", "DISPONIVEL", null, 1, 0, "45.00", "Rua Dr. Bozano", "1200", S1);
        criar("Apartamento 1 dormitório", "Compacto e bem localizado, com box de garagem.", apto, nossaSenhora,
                "ALUGUEL", null, "950.00", "DISPONIVEL", 1, 1, 1, "42.00", "Rua Appel", "77", I2, I7);
        criar("Casa com piscina", "Casa de alto padrão com piscina e área gourmet.", casa, nossaSenhora,
                "VENDA", "720000.00", null, "DISPONIVEL", 4, 3, 3, "260.00", "Rua Pinheiro Machado", "512", C3, C4, I3);
        criar("Apartamento 2 dormitórios", "Apartamento com sacada e vaga coberta.", apto, menino,
                "VENDA", "310000.00", null, "DISPONIVEL", 2, 2, 1, "75.00", "Av. Medianeira", "900", A1, I5);
        criar("Casa geminada", "Casa geminada em condomínio fechado.", casa, camobi,
                "ALUGUEL", null, "1800.00", "DISPONIVEL", 2, 1, 1, "85.00", "Rua das Acácias", "20", C5);
        criar("Casa reservada no centro", "Imóvel reservado — não deve aparecer na vitrine.", casa, centro,
                "VENDA", "410000.00", null, "RESERVADO", 3, 2, 1, "140.00", "Rua Serafim Valandro", "15", C1);
        criar("Apartamento alugado", "Imóvel alugado — não deve aparecer na vitrine.", apto, camobi,
                "ALUGUEL", null, "1400.00", "ALUGADO", 2, 1, 1, "60.00", "Rua Euclides da Cunha", "33", I1);

        // ---- Exemplos adicionais ----
        criar("Kitnet mobiliada perto da UFSM", "Kitnet com cama, armário e cozinha equipada. Contas inclusas no condomínio.",
                apto, camobi, "ALUGUEL", null, "780.00", "DISPONIVEL", 1, 1, 0, "26.00", "Rua Floriano Peixoto", "210", I5, I7);
        criar("Casa térrea no Bonfim", "Casa térrea com três quartos, pátio gramado e garagem para dois carros.",
                casa, bonfim, "VENDA", "425000.00", null, "DISPONIVEL", 3, 2, 2, "150.00", "Rua Tuiuti", "88", C1, I6);
        criar("Apartamento 3 dormitórios com suíte", "Apartamento amplo com suíte, sacada com churrasqueira e duas vagas.",
                apto, nossaSenhora, "VENDA", "560000.00", null, "DISPONIVEL", 3, 3, 2, "118.00", "Rua Silva Jardim", "640", A1, I4, I3);
        criar("Cobertura duplex no Patronato", "Cobertura duplex com terraço, lareira e vista para a Serra.",
                cobertura, patronato, "VENDA", "980000.00", null, "DISPONIVEL", 4, 4, 3, "240.00", "Av. Presidente Vargas", "1500", C8, I4, C9);
        criar("Casa de dois pisos para alugar", "Sobrado com quatro quartos, pátio e área de serviço coberta.",
                casa, tomazetti, "ALUGUEL", null, "3200.00", "DISPONIVEL", 4, 3, 2, "190.00", "Rua General Neto", "301", C5, I6);
        criar("Terreno de esquina em Camobi", "Terreno de esquina, 450 m², ótimo para residência ou comércio.",
                terreno, camobi, "VENDA", "260000.00", null, "DISPONIVEL", null, null, null, "450.00", "Av. Roraima", "s/n", T1);
        criar("Galpão comercial com escritório", "Galpão de 400 m² com pé-direito alto, escritório e dois banheiros.",
                galpao, tomazetti, "ALUGUEL", null, "6500.00", "DISPONIVEL", null, 2, 4, "400.00", "BR 287", "km 3", S1);
        criar("Sala comercial no Centro", "Sala no primeiro andar, com ar-condicionado e recepção compartilhada.",
                comercial, centro, "VENDA", "195000.00", null, "DISPONIVEL", null, 1, 1, "38.00", "Rua Vale Machado", "1010", S2, S1);
        criar("Apartamento 2 dormitórios no Menino Jesus", "Apartamento arejado, andar alto, próximo ao hospital.",
                apto, menino, "ALUGUEL", null, "1650.00", "DISPONIVEL", 2, 1, 1, "64.00", "Rua Tuiuti", "1203", I1, I2);
        criar("Casa com edícula no Bonfim", "Casa com edícula nos fundos, ideal para home office ou renda extra.",
                casa, bonfim, "ALUGUEL", null, "2700.00", "DISPONIVEL", 3, 2, 2, "140.00", "Rua Ernesto Beck", "55", C2, I3);
        criar("Apartamento compacto no Patronato", "Studio moderno, recém-reformado, com portaria 24 horas.",
                apto, patronato, "VENDA", "235000.00", null, "DISPONIVEL", 1, 1, 1, "40.00", "Rua Venâncio Aires", "2100", I5, A1);
        criar("Casa vendida no Tomazetti", "Imóvel vendido — não deve aparecer na vitrine.", casa, tomazetti,
                "VENDA", "380000.00", null, "VENDIDO", 3, 2, 1, "130.00", "Rua Marechal Floriano", "400", C9);
    }

    private BairroModel bairro(String nome, String cep) {
        return bairroRepository.findAll().stream()
                .filter(b -> nome.equals(b.getNome()))
                .findFirst()
                .orElseGet(() -> bairroRepository.save(new BairroModel(null, nome, "Santa Maria", "RS", cep)));
    }

    private TipoImovelModel tipo(String nome, String descricao) {
        return tipoImovelRepository.findAll().stream()
                .filter(t -> nome.equals(t.getNome()))
                .findFirst()
                .orElseGet(() -> tipoImovelRepository.save(new TipoImovelModel(null, nome, descricao)));
    }

    private void criar(String titulo, String descricao, TipoImovelModel tipo, BairroModel bairro,
            String finalidade, String precoVenda, String precoAluguel, String status,
            Integer dormitorios, Integer banheiros, Integer garagem, String area,
            String endereco, String numero, String... fotos) {
        ImovelModel existente = existentes.get(titulo);
        if (existente != null) {
            trocarFotosAntigas(existente, fotos); // já existe: só atualiza as fotos de exemplo antigas
            return;
        }
        ImovelModel imovel = new ImovelModel();
        imovel.setTitulo(titulo);
        imovel.setDescricao(descricao);
        imovel.setTipoImovel(tipo);
        imovel.setBairro(bairro);
        imovel.setFinalidade(finalidade);
        imovel.setPrecoVenda(precoVenda == null ? null : new BigDecimal(precoVenda));
        imovel.setPrecoAluguel(precoAluguel == null ? null : new BigDecimal(precoAluguel));
        imovel.setStatus(status);
        imovel.setDormitorios(dormitorios);
        imovel.setBanheiros(banheiros);
        imovel.setGaragem(garagem);
        imovel.setAreaTotal(new BigDecimal(area));
        imovel.setEndereco(endereco);
        imovel.setNumero(numero);
        imovel = imovelRepository.save(imovel);
        existentes.put(titulo, imovel);
        adicionarFotos(imovel, fotos);
    }

    // Fotos de exemplo (URLs externas; o front mostra uma imagem genérica caso não carreguem).
    private void adicionarFotos(ImovelModel imovel, String[] fotos) {
        for (int i = 0; i < fotos.length; i++) {
            FotoImovelModel foto = new FotoImovelModel();
            foto.setImovel(imovel);
            foto.setNomeArquivo("exemplo-" + imovel.getId() + "-" + i + ".jpg");
            foto.setCaminho("https://images.unsplash.com/photo-" + fotos[i] + "?auto=format&fit=crop&w=1000&q=75");
            foto.setCapa(i == 0);
            foto.setOrdem(i);
            fotoImovelRepository.save(foto);
        }
    }

    // Imóveis criados antes tinham fotos aleatórias do picsum.photos; troca pelas fotos de imóveis.
    // Fotos enviadas pelo admin (arquivos em /uploads) nunca são mexidas.
    private void trocarFotosAntigas(ImovelModel imovel, String[] fotos) {
        List<FotoImovelModel> antigas = fotoImovelRepository.findAll().stream()
                .filter(f -> f.getImovel() != null && imovel.getId().equals(f.getImovel().getId()))
                .filter(f -> f.getCaminho() != null && f.getCaminho().startsWith("https://picsum.photos"))
                .toList();
        if (!antigas.isEmpty()) {
            fotoImovelRepository.deleteAll(antigas);
            adicionarFotos(imovel, fotos);
        }
    }
}
