import { DocCode } from "../../../components/document/DocCode.js"
import { DocCodeBlock } from "../../../components/document/DocCodeBlock.js"
import { DocExample } from "../../../components/document/DocExample.js"
import { DocHeader } from "../../../components/document/DocHeader.js"
import { DocLink } from "../../../components/document/DocLink.js"
import { DocList } from "../../../components/document/DocList.js"
import { DocParagraph } from "../../../components/document/DocParagraph.js"
import { DocRoot } from "../../../components/document/DocRoot.js"
import { DocSection } from "../../../components/document/DocSection.js"
import { DocTip } from "../../../components/document/DocTip.js"
import { useSiteOrigin } from "../../../utilities/useSiteOrigin.js"

export function InstallationGuideDocPage() {
    const origin = useSiteOrigin()
    return (
        <DocRoot>
            <DocHeader
                title="Installation"
                description="Installer et démarrer Comptasse en quelques minutes"
            />

            <DocSection title="Prérequis">
                <DocList
                    items={[
                        "Docker et Docker Compose installés",
                        "Un accès à une base de données PostgreSQL (version 15 ou supérieure)",
                        "Un stockage compatible S3 (AWS S3, MinIO, RustFS, etc.)",
                    ]}
                />
                <DocTip variant="info">
                    Vous n'avez pas de PostgreSQL ou de S3 ? Utilisez la méthode{" "}
                    <DocLink to="/documentation/guide/installation#compose-avec-services-intégrés">
                        Compose avec services intégrés
                    </DocLink>{" "}
                    qui inclut tout dans un seul fichier.
                </DocTip>
            </DocSection>

            <DocSection title="Méthode 1 : Script d'installation (recommandé)">
                <DocParagraph>
                    Le script d'installation guide pas à pas et configure automatiquement l'environnement. Il fonctionne
                    sur macOS et Linux et installe l'API, le Dashboard et le CLI.
                </DocParagraph>

                <DocExample title="Installation automatique">
                    <DocCodeBlock>{`curl -fsSL ${origin}/install.sh | sh`}</DocCodeBlock>
                </DocExample>

                <DocExample title="Ce que fait le script">
                    <DocList
                        items={[
                            "Vérifie que Docker est installé et en cours d'exécution",
                            "Demande si vous avez déjà un PostgreSQL et un S3, ou si vous souhaitez des services intégrés",
                            "Si services intégrés : configure PostgreSQL et RustFS automatiquement",
                            "Si services externes : demande les identifiants de connexion",
                            "Génère une clé de signature des sessions (COOKIES_KEY) si non fournie",
                            "Crée le répertoire de configuration dans ~/.comptasse",
                            "Télécharge et démarre les images Docker API + Dashboard (le site web est hébergé par l'équipe Comptasse)",
                            "Installe le CLI sur la machine hôte depuis les GitHub Releases",
                        ]}
                    />
                </DocExample>

                <DocTip variant="info">
                    Le script choisit la source des images en fonction de l'origine du téléchargement : depuis
                    <DocCode>https://comptasse.com</DocCode> (production), il télécharge les images publiées (API +
                    Dashboard) sur GHCR ; depuis tout autre origine, par exemple <DocCode>http://localhost</DocCode> en
                    développement, il construit les images à partir des sources sans passer par un registre — ce qui
                    requiert une copie du dépôt Comptasse sur la machine.
                </DocTip>

                <DocExample title="Après l'installation">
                    <DocList
                        items={[
                            "Dashboard : http://localhost:5173",
                            "API : http://localhost:3000",
                            "CLI : comptasse --help (installé dans ~/.local/bin)",
                        ]}
                    />
                </DocExample>
            </DocSection>

            <DocSection title="Méthode 2 : Installation manuelle avec Docker">
                <DocParagraph>
                    Pour un contrôle total sur la configuration, lancez les conteneurs API et Dashboard avec{" "}
                    <DocCode>docker run</DocCode>.
                </DocParagraph>

                <DocExample title="Avec vos propres services">
                    <DocCodeBlock>{`docker run -d \\
  --name comptasse-api \\
  -p 3000:3000 \\
  -e ENV=production \\
  -e VERBOSE=false \\
  -e PORT=3000 \\
  -e CORS_ORIGIN=http://localhost:5173 \\
  -e COOKIES_DOMAIN=localhost \\
  -e COOKIES_KEY=UNE_CLE_SIGNATURE_32_CARACTERES \\
  -e API_BASE_URL=http://localhost:3000 \\
  -e WEBSITE_BASE_URL=https://comptasse.com \\
  -e DASHBOARD_BASE_URL=http://localhost:5173 \\
  -e SQL_DATABASE_URL=postgres://user:password@host:5432/comptasse \\
  -e STORAGE_ENDPOINT=https://s3.amazonaws.com \\
  -e STORAGE_BUCKET_NAME=my-bucket \\
  -e STORAGE_ACCESS_KEY=VOTRE_CLE_ACCES_S3 \\
  -e STORAGE_SECRET_KEY=VOTRE_CLE_SECRETE_S3 \\
  ghcr.io/comptasse/api

docker run -d \\
  --name comptasse-dashboard \\
  -p 5173:80 \\
  ghcr.io/comptasse/dashboard`}</DocCodeBlock>
                </DocExample>

                <DocExample title="Variables d'environnement (API)">
                    <DocList
                        items={[
                            "SQL_DATABASE_URL (requis) : chaîne de connexion PostgreSQL",
                            "STORAGE_ENDPOINT (requis) : URL du service S3",
                            "STORAGE_BUCKET_NAME (requis) : nom du bucket",
                            "STORAGE_ACCESS_KEY (requis) : clé d'accès S3",
                            "STORAGE_SECRET_KEY (requis) : clé secrète S3",
                            "STORAGE_REGION (optionnel) : région S3, défaut fr-par",
                            "CORS_ORIGIN (requis) : origine autorisée pour le navigateur",
                            "COOKIES_KEY (optionnel) : clé de signature, générée automatiquement si absente",
                        ]}
                    />
                </DocExample>
            </DocSection>

            <DocSection title="Méthode 3 : Compose avec services intégrés">
                <DocParagraph>
                    Si vous n'avez pas de PostgreSQL ou de S3, ce fichier <DocCode>compose.yml</DocCode> inclut tout :
                    l'API, le Dashboard, PostgreSQL et RustFS (stockage S3). Le Dashboard est construit avec{" "}
                    <DocCode>VITE_API_BASE_URL=/api</DocCode> et son nginx relaie les requêtes <DocCode>/api</DocCode>{" "}
                    vers le service <DocCode>api</DocCode>.
                </DocParagraph>

                <DocExample title="Fichier compose.yml">
                    <DocCodeBlock>{`services:
  api:
    image: ghcr.io/comptasse/api
    ports:
      - "3000:3000"
    environment:
      ENV: production
      VERBOSE: "false"
      PORT: "3000"
      CORS_ORIGIN: http://localhost:5173
      COOKIES_DOMAIN: localhost
      COOKIES_KEY: UNE_CLE_SIGNATURE_32_CARACTERES
      API_BASE_URL: http://localhost:3000
      WEBSITE_BASE_URL: https://comptasse.com
      DASHBOARD_BASE_URL: http://localhost:5173
      SQL_DATABASE_URL: postgres://postgres:password@postgres:5432/comptasse
      STORAGE_ENDPOINT: http://rustfs:9000
      STORAGE_BUCKET_NAME: comptasse-files
      STORAGE_ACCESS_KEY: admin
      STORAGE_SECRET_KEY: admin
    depends_on:
      postgres:
        condition: service_healthy
      rustfs:
        condition: service_started
    restart: unless-stopped

  dashboard:
    image: ghcr.io/comptasse/dashboard
    ports:
      - "5173:80"
    depends_on:
      - api
    restart: unless-stopped

  postgres:
    image: postgres:18.1
    volumes:
      - postgres-data:/var/lib/postgresql
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
      POSTGRES_DB: comptasse
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d comptasse"]
      interval: 5s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  rustfs:
    image: rustfs/rustfs:latest
    volumes:
      - rustfs-data:/data
    environment:
      RUSTFS_CONSOLE_ENABLE: "false"
      RUSTFS_ACCESS_KEY: admin
      RUSTFS_SECRET_KEY: admin
      RUSTFS_VOLUMES: /data
    restart: unless-stopped

volumes:
  postgres-data:
  rustfs-data:`}</DocCodeBlock>
                </DocExample>

                <DocExample title="Démarrage">
                    <DocCodeBlock>{`# Sauvegardez le fichier ci-dessus dans compose.yml
docker compose up -d

# Vérifiez que les services sont démarrés
docker compose ps`}</DocCodeBlock>
                </DocExample>

                <DocTip variant="warning">
                    Ce mode est destiné au développement et aux tests. Pour la production, utilisez vos propres services
                    PostgreSQL et S3 avec des identifiants sécurisés.
                </DocTip>
            </DocSection>

            <DocSection title="Premiers pas après installation">
                <DocList
                    items={[
                        "Ouvrez http://localhost:5173 dans votre navigateur",
                        "Créez un compte utilisateur",
                        "Créez votre première organisation",
                        "Ajoutez un exercice comptable",
                        "Commencez à saisir des écritures",
                    ]}
                />
                <DocTip variant="info">
                    Pour un guide détaillé de l'interface, consultez la page{" "}
                    <DocLink to="/documentation/guide/démarrer">Démarrer avec Comptasse</DocLink>.
                </DocTip>
            </DocSection>

            <DocSection title="Installation du CLI">
                <DocParagraph>
                    Le CLI est un client HTTP autonome qui communique avec l'API. Il est distribué via les GitHub
                    Releases et s'installe sur votre machine hôte.
                </DocParagraph>

                <DocExample title="Sur votre machine hôte">
                    <DocCodeBlock>{`curl -fsSL ${origin}/cli/install.sh | sh

# Vérifiez l'installation
comptasse --version

# Connectez-vous à votre instance
comptasse login --api-key VOTRE_CLE_API --url http://localhost:3000`}</DocCodeBlock>
                </DocExample>
            </DocSection>
        </DocRoot>
    )
}
