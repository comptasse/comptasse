import { ButtonPlainContent } from "@comptasse/ui"
import { css } from "@comptasse/ui/utilities/cn.js"
import { IconPlus } from "@tabler/icons-react"
import { useParams } from "@tanstack/react-router"
import { Section } from "../../../../../components/layouts/section/section.tsx"
import { CreateOneTag } from "./CreateOneTag.tsx"
import { TagsListTable } from "./TagsListTable.tsx"

export function TagsPage({
    idOrganization: idOrganizationProp,
    idYear: idYearProp,
}: {
    idOrganization?: string
    idYear?: string
} = {}) {
    const params = useParams({
        strict: false,
    }) as {
        idOrganization?: string
        idYear?: string
    }
    const idOrganization = idOrganizationProp ?? params.idOrganization ?? ""
    const idYear = idYearProp ?? params.idYear ?? ""

    return (
        <Section.Root>
            <Section.Item>
                <div
                    className={css({
                        width: "100%",
                        display: "flex",
                        justifyContent: "flex-start",
                        alignItems: "center",
                        gap: "0.5rem",
                    })}
                >
                    <CreateOneTag
                        idOrganization={idOrganization}
                        idYear={idYear}
                    >
                        <ButtonPlainContent
                            leftIcon={<IconPlus />}
                            text="Ajouter une catégorie"
                        />
                    </CreateOneTag>
                </div>
                <TagsListTable
                    idOrganization={idOrganization}
                    idYear={idYear}
                />
            </Section.Item>
        </Section.Root>
    )
}
