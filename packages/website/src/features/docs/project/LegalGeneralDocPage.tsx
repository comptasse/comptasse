import { DocLink } from "../../../components/document/DocLink.js"
import { DocParagraph } from "../../../components/document/DocParagraph.js"
import { DocRoot } from "../../../components/document/DocRoot.js"
import { DocTextSection } from "../../../components/document/DocTextSection.js"
import { DocTip } from "../../../components/document/DocTip.js"

export function LegalGeneralDocPage() {
    return (
        <DocRoot>
            <DocTextSection title="Éditeur du site">
                <DocParagraph>
                    Le site comptasse.com est édité par Barbote SAS, société par actions simplifiée au capital de
                    1000.00 euros, immatriculée au Registre du Commerce et des Sociétés de Paris sous le numéro 908 719
                    503.
                </DocParagraph>
                <DocParagraph>Siège social : 93 rue Sedaine, 75011 Paris</DocParagraph>
                <DocParagraph>Numéro de TVA intracommunautaire : FR02 908 719 503</DocParagraph>
                <DocParagraph>Directeur de la publication : Emile Sabatier</DocParagraph>
                <DocParagraph>
                    Contact : <DocLink href="mailto:contact@comptasse.com">contact@comptasse.com</DocLink>
                </DocParagraph>
            </DocTextSection>

            <DocTextSection title="Hébergement">
                <DocParagraph>Le site est hébergé par la société :</DocParagraph>
                <DocParagraph>
                    OVH
                    <br />
                    RCS Lille Métropole, 424 761 419 00045
                    <br />2 rue Kellermann - 59100 Roubaix - France
                </DocParagraph>
            </DocTextSection>

            <DocTextSection title="Propriété intellectuelle">
                <DocParagraph>
                    L'ensemble du contenu de ce site (textes, images, vidéos, logos, icônes, etc.) est protégé par les
                    lois relatives à la propriété intellectuelle.
                </DocParagraph>
                <DocParagraph>
                    Le code source de Comptasse est distribué sous licence{" "}
                    <DocLink
                        href="https://raw.githubusercontent.com/comptasse/comptasse/refs/heads/main/LICENSE"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        AGPL-3.0
                    </DocLink>
                    . Consultez notre dépôt GitHub pour plus d'informations.
                </DocParagraph>
            </DocTextSection>

            <DocTextSection title="Données personnelles">
                <DocParagraph>
                    Les informations relatives au traitement de vos données personnelles sont détaillées dans notre{" "}
                    <DocLink to="/documentation/confidentialité">Politique de confidentialité</DocLink>.
                </DocParagraph>
            </DocTextSection>

            <DocTextSection title="Cookies">
                <DocParagraph>
                    Ce site utilise des cookies strictement nécessaires au fonctionnement du service. Aucun cookie
                    publicitaire ou de traçage n'est utilisé.
                </DocParagraph>
            </DocTextSection>

            <DocTextSection title="Limitation de responsabilité">
                <DocParagraph>
                    Comptasse s'efforce de fournir des informations exactes et à jour sur ce site. Toutefois, nous ne
                    pouvons garantir l'exactitude, la complétude ou l'actualité des informations diffusées.
                </DocParagraph>
                <DocParagraph>
                    L'utilisateur est seul responsable de l'utilisation qu'il fait des informations et fonctionnalités
                    disponibles sur ce site.
                </DocParagraph>
            </DocTextSection>

            <DocTip>
                Pour toute question, vous pouvez nous contacter à{" "}
                <DocLink href="mailto:contact@comptasse.com">contact@comptasse.com</DocLink>.
            </DocTip>
        </DocRoot>
    )
}
