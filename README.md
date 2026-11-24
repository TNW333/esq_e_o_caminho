# Comunas

Feed em português com stories sobre seis figuras ligadas ao comunismo, incluindo Jones Manoel. As publicações têm curtidas, comentários, links para compartilhar e uma aba de salvos.

## Rodar localmente

Use Node.js 22.12 ou mais recente.

```sh
npm ci
npm run dev
```

Para gerar o site estático, rode `npm run build`. O resultado fica em `dist/`.

## Publicar no GitHub Pages

1. Envie o conteúdo do projeto à raiz de um repositório GitHub na branch `main`. Inclua os arquivos ocultos `.gitignore` e `.github/workflows/pages.yml`.
2. Em **Settings → Pages → Build and deployment**, selecione **GitHub Actions** como fonte.
3. Na aba **Actions**, execute o workflow **Publicar no GitHub Pages** ou faça um novo push para `main`. Ao concluir, o workflow mostra o endereço do site.

Curtidas, comentários, stories vistos e salvos são armazenados no navegador. Os retratos carregam pela internet e cada story contém o crédito da foto.
