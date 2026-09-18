import { IconBrandGithub, IconExternalLink } from "@tabler/icons-react"
import { DocCode } from "../../../components/document/DocCode.js"
import { DocHeader } from "../../../components/document/DocHeader.js"
import { DocLink } from "../../../components/document/DocLink.js"
import { DocList } from "../../../components/document/DocList.js"
import { DocParagraph } from "../../../components/document/DocParagraph.js"
import { DocRoot } from "../../../components/document/DocRoot.js"
import { DocSection } from "../../../components/document/DocSection.js"
import { DocTip } from "../../../components/document/DocTip.js"

const githubUrl = "https://github.com/comptasse/comptasse"

export function ContributeGeneralDocPage() {
    return (
        <DocRoot>
            <DocHeader
                title="Contribuer au projet"
                description="Comptasse est un projet open source, et toute contribution est la bienvenue. Voici comment vous pouvez aider."
            />

            <DocSection title="Pourquoi contribuer ?">
                <DocParagraph>
                    Comptasse est un projet communautaire. Que vous soyez développeur, designer, comptable, rédacteur ou
                    utilisateur, votre contribution aide à faire avancer le projet et à le rendre meilleur pour tout le
                    monde.
                </DocParagraph>
            </DocSection>

            <DocSection title="Les différentes façons de contribuer">
                <DocParagraph>Vous pouvez contribuer de plusieurs manières :</DocParagraph>
                <DocList
                    items={[
                        "Participer aux discussions et partager vos retours",
                        "Signaler un bug rencontré",
                        "Proposer une nouvelle fonctionnalité",
                        "Améliorer la documentation",
                        "Contribuer du code (correctifs, tests, refactorings)",
                    ]}
                />
            </DocSection>

            <DocSection title="Signaler un bug">
                <DocParagraph>
                    Vous avez trouvé un bug ? Signalez-le en créant une issue sur GitHub. Pour nous aider à le corriger
                    rapidement, décrivez précisément le problème et les étapes pour le reproduire.
                </DocParagraph>
                <DocLink
                    href={`${githubUrl}/issues`}
                    target="_blank"
                    rel="noopener noreferrer"
                    buttonProps={{
                        leftIcon: <IconBrandGithub />,
                        text: "Voir les issues",
                        rightIcon: <IconExternalLink />,
                    }}
                />
                <DocParagraph>
                    Un bon rapport de bug inclut généralement : un titre clair, une description du comportement attendu,
                    les étapes de reproduction, votre environnement (OS, navigateur, version de Comptasse) et des
                    captures d'écran si possible.
                </DocParagraph>
            </DocSection>

            <DocSection title="Proposer une amélioration">
                <DocParagraph>
                    Une idée pour améliorer Comptasse ? Ouvrez une issue ou une discussion sur GitHub pour la partager
                    avec la communauté avant de vous lancer dans le développement.
                </DocParagraph>
                <DocLink
                    href={`${githubUrl}/discussions`}
                    target="_blank"
                    rel="noopener noreferrer"
                    buttonProps={{
                        leftIcon: <IconBrandGithub />,
                        text: "Voir les discussions",
                        rightIcon: <IconExternalLink />,
                    }}
                />
            </DocSection>

            <DocSection title="Contribuer au code">
                <DocParagraph>
                    Les contributions de code sont les bienvenues. Commencez par forker le dépôt, cloner votre fork et
                    installer les dépendances.
                </DocParagraph>
                <DocParagraph>
                    Créez une branche dédiée à votre contribution, apportez vos modifications, puis ouvrez une pull
                    request vers la branche <DocCode>main</DocCode> du dépôt principal.
                </DocParagraph>
                <DocParagraph>
                    Chaque contribution compte, même la plus petite : correction d'un bug, amélioration de la
                    documentation, ajout de tests, ou refactoring de code.
                </DocParagraph>
                <DocLink
                    href={`${githubUrl}/blob/main/docs/CONTRIBUTING.md`}
                    target="_blank"
                    rel="noopener noreferrer"
                    buttonProps={{
                        leftIcon: <IconBrandGithub />,
                        text: "Voir le CONTRIBUTING.md",
                        rightIcon: <IconExternalLink />,
                    }}
                />
            </DocSection>

            <DocSection title="Contribuer à la documentation">
                <DocParagraph>
                    La documentation est essentielle pour un projet open source. Aidez-nous à l'améliorer : corrigez les
                    fautes, clarifiez les passages ambigus, ou rédigez de nouvelles pages.
                </DocParagraph>
                <DocParagraph>
                    La documentation se trouve principalement dans le dossier{" "}
                    <DocCode>packages/website/src/features/docs</DocCode>. Les modifications suivent le même processus
                    de pull request que les contributions code.
                </DocParagraph>
            </DocSection>

            <DocTip title="Code de conduite">
                <DocParagraph>
                    Nous attendons de chaque contributeur qu'il respecte un comportement bienveillant et inclusif. Les
                    discussions doivent rester constructives, respectueuses et centrées sur l'amélioration du projet.
                </DocParagraph>
            </DocTip>
        </DocRoot>
    )
}
