# factu.app — Application Windows

## Structure
```
electron-app/
├── .github/
│   └── workflows/
│       └── build.yml      ← GitHub Actions : compile le .exe automatiquement
├── src/
│   ├── main.js            ← Processus principal Electron
│   └── index.html         ← L'application (copie de la PWA)
├── package.json           ← Config Electron + electron-builder
└── README.md
```

## Installation sur GitHub

1. Crée un **nouveau dépôt GitHub** : `factu-app-desktop`
2. Upload tous ces fichiers en respectant la structure des dossiers
3. GitHub Actions se déclenche automatiquement et compile le `.exe`
4. Va dans **Actions** → clique sur le workflow → télécharge l'artifact `factu-app-windows`
5. Installe le `.exe` sur ton PC

## Mise à jour

Quand tu mets à jour `index.html` (nouvelle version de l'app) :
1. Remplace `src/index.html` sur GitHub
2. GitHub recompile automatiquement le `.exe`
3. Télécharge et réinstalle

## Notes
- L'icône `src/icon.ico` est optionnelle — sans elle l'app aura l'icône Electron par défaut
- Pour ajouter une icône : crée un fichier `icon.ico` 256x256 et place-le dans `src/`
