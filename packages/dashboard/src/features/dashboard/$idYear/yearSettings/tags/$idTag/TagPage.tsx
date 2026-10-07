import { readOneTagRouteDefinition } from "@comptasse/application-metadata/routes"
import { FormatText } from "@comptasse/ui"
import { css } from "@comptasse/ui/utilities/cn.js"
import { useParams } from "@tanstack/react-router"
import { DataWrapper } from "../../../../../../components/layouts/DataWrapper.tsx"
import { DataBlock } from "../../../../../../components/layouts/dataBlock/dataBlock.tsx"
import { Section } from "../../../../../../components/layouts/section/section.tsx"

export function TagPage() {
    const params = useParams({
        strict: false,
    }) as {
        idYear: string
        idTag: string
    }

    return (
        <DataWrapper
            routeDefinition={readOneTagRouteDefinition}
            body={{
                idTag: params.idTag,
            }}
        >
            {(tag) => {
                return (
                    <Section.Item
                        className={css({
                            flexDirection: "column",
                        })}
                    >
                        <DataBlock.Root>
                            <DataBlock.Header title="Informations" />
                            <DataBlock.Content>
                                <DataBlock.Item label="Libellé">
                                    <FormatText>{tag.label}</FormatText>
                                </DataBlock.Item>
                            </DataBlock.Content>
                        </DataBlock.Root>
                    </Section.Item>
                )
            }}
        </DataWrapper>
    )
}
