# 📥 Instalação da Fonte Inter

## Passo 1: Baixar Fontes

Baixe as fontes Inter do Google Fonts:

1. Acesse: https://fonts.google.com/specimen/Inter
2. Clique em "Get font" (canto superior direito)
3. Clique em "Download all" (ícone de download)
4. Extraia o arquivo ZIP

## Passo 2: Copiar Arquivos

Copie os seguintes arquivos da pasta extraída para:
`mobile/assets/fonts/`

- `Inter_24pt-Regular.ttf` (peso 400)
- `Inter_24pt-Medium.ttf` (peso 500)
- `Inter_24pt-SemiBold.ttf` (peso 600)
- `Inter_24pt-Bold.ttf` (peso 700)

## Passo 3: Verificar

Após copiar, a estrutura deve ficar assim:

```
mobile/
  assets/
    fonts/
      Inter_24pt-Regular.ttf
      Inter_24pt-Medium.ttf
      Inter_24pt-SemiBold.ttf
      Inter_24pt-Bold.ttf
```

## Passo 4: Testar

Execute o app:

```bash
cd mobile
npx expo start
```

Se as fontes estiverem corretas, o app deve carregar sem erros e usar a fonte Inter em toda a interface.

## Fallback

Se as fontes não carregarem, o app usará automaticamente `system-ui` como fallback (definido em `src/theme.ts`).

---

**Link direto para download:**
https://fonts.google.com/download?family=Inter