# ✦ Aura.AI

Interface de chat IA générative multifonction — 100% gratuite, sans clé API, utilisable directement dans le navigateur.
Réalisée par ANTON NELCON Steve

![HTML](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)
![CSS](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)

<img width="1910" height="872" alt="image" src="https://github.com/user-attachments/assets/9101ad38-feab-4516-9e79-15945c406560" />


---

##  Sommaire

- [Aperçu](#aperçu)
- [Fonctionnalités](#fonctionnalités)
- [Technologies & APIs](#technologies--apis)
- [Installation](#installation)
- [Utilisation](#utilisation)
- [Structure du projet](#structure-du-projet)
- [Personnalisation](#personnalisation)

---

## Aperçu

Aura.AI est une application web front-end qui regroupe plusieurs outils IA dans une interface de chat unifiée. Elle fonctionne entièrement côté navigateur, sans serveur backend ni clé API à configurer.

---

## Fonctionnalités

###  Chat IA avec mémoire
Conversations multi-tours avec contexte persistant (10 derniers messages). Réponses en Markdown avec coloration syntaxique des blocs de code.

###  Génération d'images
Créez des images à partir d'un prompt en langage naturel.
> Ex : *"Génère une image de forêt enchantée au coucher de soleil"*

###  Météo en direct
Affiche la température, le ressenti, le vent et l'humidité pour n'importe quelle ville du monde.
> Ex : *"Météo Tokyo"*

###  Traduction
Traduisez du texte vers l'anglais, l'espagnol, l'allemand, l'italien, le japonais, le portugais, le chinois ou l'arabe.
> Ex : *"Traduis en anglais : Bonjour tout le monde"*

###  Calculatrice
Calculs mathématiques en langage naturel ou en expression pure.
> Ex : *"Calcule (145 \* 32) / 4 + 78"* ou directement *"25 \* 4 + 10"*

###  Résumé de texte
Synthèse automatique en points clés Markdown.
> Ex : *"Résume ce texte : ..."*

###  Blagues
Blagues en français (avec fallback anglais de développeur si l'API principale est indisponible).

###  Mode clair / sombre
Préférence sauvegardée dans le `localStorage`.

###  Historique des sessions
Les conversations sont sauvegardées en mémoire et accessibles depuis la sidebar.

---

## Technologies & APIs

| Service | Rôle | Gratuit |
|---|---|---|
| [Pollinations Text](https://text.pollinations.ai) | Chat IA (GPT-4o-mini) & Traduction |  Sans clé |
| [Pollinations Image](https://pollinations.ai/p/) | Génération d'images |  Sans clé |
| [Open-Meteo](https://open-meteo.com) | Météo temps réel |  Sans clé |
| [Geocoding API](https://open-meteo.com/en/docs/geocoding-api) | Géolocalisation des villes |  Sans clé |
| [JokeAPI](https://jokeapi.dev) | Blagues en français |  Sans clé |
| [Marked.js](https://marked.js.org) | Rendu Markdown |  Open source |
| [Highlight.js](https://highlightjs.org) | Coloration syntaxique |  Open source |

---

## Installation

Aucune dépendance à installer. Il suffit d'ouvrir le fichier HTML dans un navigateur.

```bash
# Cloner le projet
git clone https://github.com/votre-utilisateur/aura-ai.git
cd aura-ai

# Ouvrir directement (ou utiliser un serveur local)
open index.html
```

Pour éviter les restrictions CORS en développement, vous pouvez utiliser un petit serveur local :

```bash
# Avec Python
python -m http.server 8080

# Avec Node.js (npx)
npx serve .
```

Puis ouvrir `http://localhost:8080` dans le navigateur.

---

## Utilisation

### Commandes rapides

| Ce que vous tapez | Ce qui se passe |
|---|---|
| `Génère une image de ...` | Génère une image via Pollinations |
| `Météo [ville]` | Affiche la météo en temps réel |
| `Traduis en [langue] : ...` | Traduction instantanée |
| `Calcule [expression]` | Résultat mathématique |
| `Résume ce texte : ...` | Synthèse en points clés |
| `Raconte-moi une blague` | Blague aléatoire |
| Tout autre message | Chat IA avec mémoire de conversation |

### Raccourcis clavier

| Touche | Action |
|---|---|
| `Entrée` | Envoyer le message |
| `Maj + Entrée` | Saut de ligne |

---

## Structure du projet

```
aura-ai/
├── index.html   # Structure HTML, sidebar, zone de chat, zone d'input
├── style.css    # Design system complet (thème clair/sombre, animations)
├── script.js    # Logique applicative, routeur d'intentions, appels API
└── README.md    # Ce fichier
```

### Routeur d'intentions (`script.js`)

Le routeur analyse chaque message et le dirige vers le bon module :

```
Message utilisateur
       │
       ├── contient "image / génère / dessine" → generateImage()
       ├── contient "blague / humour"           → fetchJoke()
       ├── contient "météo / temps"             → fetchWeather()
       ├── contient "traduis / translate"       → callAI() [mode traducteur]
       ├── contient "résume"                    → callAI() [mode synthèse]
       ├── expression mathématique pure         → calculateMaths()
       └── tout le reste                        → callAIWithHistory()
```

---

## Personnalisation

### Changer le nom / la personnalité de l'IA

Dans `script.js`, modifiez le `systemPrompt` dans `callAIWithHistory()` :

```js
const systemPrompt = `Tu es [NOM], une IA [DESCRIPTION].
Tu réponds toujours en français...`;
```

### Changer les couleurs

Dans `style.css`, modifiez les variables CSS du thème sombre ou clair :

```css
:root {
    --accent-1: #8a2be2;   /* Couleur principale */
    --accent-2: #4a00e0;   /* Dégradé secondaire */
    --bg-base:  #0d0b18;   /* Fond de page */
}
```

### Ajouter un nouveau module

1. Créez une fonction dans `script.js` (ex: `async function fetchNews()`)
2. Ajoutez une condition dans le routeur `handleSend()`
3. Ajoutez un bouton dans la sidebar HTML si besoin

---

## Limites connues

- **Pollinations** applique un rate limit (~1 requête/15s en anonyme). En cas de surcharge, l'image peut ne pas s'afficher.
- **L'historique** de conversation est en mémoire uniquement — il est perdu au rechargement de la page.
- **Pas de mode hors-ligne** — toutes les fonctionnalités nécessitent une connexion internet.

---

*Projet open-source — libre de modification et de réutilisation.*
