# page_cv — CV en ligne de Lancelin PEREZ

CV statique et responsive, publié avec GitHub Pages. Pour découvrir le CV, on peut jouer à un mini-jeu de hacking (« Opération Dossier Secret ») ou y accéder directement.

- **Site :** https://lancelinperez.github.io/page_cv/
- **Dépôt :** https://github.com/lancelinperez/page_cv

## Structure

```
index.html      page unique (HTML sémantique)
css/style.css   styles (mobile d'abord, polices système)
js/app.js       mini-jeu (chargé avec defer, sans bibliothèque)
img/            favicon SVG (aucune photo lourde)
cv.md           contenu du CV rédigé en Markdown
```

## Publication (GitHub Pages)

1. Envoyer les fichiers à la racine du dépôt `page_cv` (branche `main`).
2. Settings → Pages → Source : *Deploy from a branch*, branche `main`, dossier `/ (root)`.
3. Attendre 1 à 2 minutes, puis tester l'URL sur smartphone.

## Choix techniques

- **Confidentialité :** aucun téléphone, adresse ni e-mail personnel. Le seul contact est le profil GitHub.
- **SEO :** un seul `<h1>`, `<title>` et `<meta name="description">` renseignés, balises `header`, `nav`, `main`, `section`, `article`, `footer`, données structurées schema.org.
- **Titres :** H1 (nom) → H2 (jeu et sections du CV) → H3 (expériences, formations, langues) → H4 (« Missions »), sans saut de niveau.
- **Accessibilité :** lien d'évitement vers le CV, focus visible, jeu entièrement jouable au clavier (1 à 4, Espace, Entrée), journal du terminal annoncé aux lecteurs d'écran (`aria-live`), textes de liens explicites, contrastes élevés, police ≥ 16 px, respect de `prefers-reduced-motion`.
- **Sans JavaScript :** le jeu est masqué et le CV s'affiche directement (`<noscript>`).
- **Performances :** aucune image bitmap, aucune police web, aucune bibliothèque, script en `defer`.
- **Impression :** une feuille d'impression n'imprime que le CV.

## Auto-évaluation

Tests réalisés le 18/11/2026 sur https://lancelinperez.github.io/page_cv/.

| Outil | Résultat |
|---|---|
| W3C Validator (HTML) | 0 erreur, 0 avertissement |
| W3C Validator (CSS) | 1 erreur trouvée (`font-smooth`, propriété non standard) → supprimée |
| Outiref (titres) | H1 unique (nom) · hiérarchie H1 → H2 → H3 → H4 sans saut de niveau |
| PageSpeed mobile — Performance | 100 / 100 |
| PageSpeed mobile — Accessibilité | 100 / 100 |
| PageSpeed mobile — Bonnes pratiques | 100 / 100 |
| PageSpeed mobile — SEO | 100 / 100 |

Mesures PageSpeed mobile (Moto G Power émulé, 4G lente) : FCP 0,8 s · LCP 0,8 s · TBT 0 ms · CLS 0 · Speed Index 2,2 s.

**Analyse :** les très bons scores viennent de l'absence d'image bitmap, de police web et de bibliothèque, du script chargé en `defer`, et d'un HTML sémantique avec des contrastes vérifiés. Le Speed Index (2,2 s) s'explique par les animations d'apparition du titre et du terminal.

### Améliorations entre la V1 et la version finale

- Suppression des données personnelles (e-mail, téléphone, adresse) : contact par GitHub uniquement.
- Suppression d'une image manquante (`img/bain.jpg`) qui provoquait une erreur 404.
- Correction d'une erreur W3C : un titre `<h3>` était placé dans `<address>`.
- Correction de la hiérarchie des titres : faux titres H4/H5 remplacés par des paragraphes, `<h6>` du pied de page retiré.
- Correction d'un défaut de contraste : le texte du CV était vert clair sur fond crème.
- Ajout d'une navigation (`<nav>`) et d'un lien d'évitement.
- CSS réécrit « mobile d'abord », sans code mort, avec des tailles de texte ≥ 16 px.
- Nouveau design (terminal néon + dossier « déclassifié ») et mini-jeu en 5 épreuves avec score, combos, vies et rang final.
- Itérations après publication : style pixel art, épreuve de timing rendue plus facile, réponses à position fixe, numéro de version sur le CSS et le JS pour éviter l'ancien cache, suppression de la propriété CSS non standard signalée par le W3C.
