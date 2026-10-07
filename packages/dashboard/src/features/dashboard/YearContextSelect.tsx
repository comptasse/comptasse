import { readAllYearsRouteDefinition } from "@comptasse/application-metadata"
import { Button, ButtonGhostContent, ButtonPlainContent, Separator } from "@comptasse/ui"
import { IconChevronDown } from "@tabler/icons-react"
import { useState } from "react"
import { Popover } from "../../components/overlays/popover/popover.js"
import { useDataFromAPI } from "../../utilities/useHTTPData.js"
import { CreateOneYear } from "./$idOrganization/years/CreateOneYear.js"

export function YearContextSelect(props: {
    value: string | null
    onChange: (v: string | null) => void
    idOrganizationSelected: string | null
}) {
    const [open, setOpen] = useState(false)
    const yearsData = useDataFromAPI({
        routeDefinition: readAllYearsRouteDefinition,
        body: {},
        params: props.idOrganizationSelected
            ? {
                  idOrganization: props.idOrganizationSelected,
              }
            : undefined,
        enabled: props.idOrganizationSelected !== null,
    })

    const options: Array<{
        key: string
        label: string
    }> = []
    for (const y of yearsData.data ?? []) {
        if (y.idOrganization !== props.idOrganizationSelected) continue
        options.push({
            key: y.id,
            label: y.label,
        })
    }

    const selectedLabel = options.find((option) => option.key === props.value)?.label

    if (options.length === 0) {
        if (!props.idOrganizationSelected) return null
        return (
            <CreateOneYear idOrganization={props.idOrganizationSelected}>
                <ButtonPlainContent text="Ajouter un exercice" />
            </CreateOneYear>
        )
    }

    return (
        <Popover.Root
            open={open}
            onOpenChange={setOpen}
        >
            <Popover.Trigger asChild>
                <Button hasLoader={yearsData.isPending}>
                    <ButtonGhostContent
                        text={selectedLabel ?? "Sélectionner un exercice"}
                        isLoading={yearsData.isPending}
                        rightIcon={<IconChevronDown />}
                    />
                </Button>
            </Popover.Trigger>
            <Popover.Content
                align="start"
                className={{
                    padding: "0.5rem",
                    minWidth: "160px",
                    maxHeight: "260px",
                    overflowY: "auto",
                    gap: "0.25rem",
                }}
            >
                {options.map((option) => (
                    <Button
                        key={option.key}
                        onClick={() => {
                            props.onChange(option.key === props.value ? null : option.key)
                            setOpen(false)
                        }}
                        className={{
                            width: "100%",
                        }}
                    >
                        <ButtonGhostContent
                            text={option.label}
                            isCurrent={option.key === props.value}
                            className={{
                                width: "100%",
                                justifyContent: "start",
                            }}
                        />
                    </Button>
                ))}
                <Separator
                    className={{
                        marginY: "0.25rem",
                    }}
                />
                {props.idOrganizationSelected !== null && (
                    <CreateOneYear
                        idOrganization={props.idOrganizationSelected}
                        className={{
                            width: "100%",
                        }}
                        onClick={() => setOpen(false)}
                    >
                        <ButtonGhostContent
                            text="Ajouter un exercice"
                            className={{
                                width: "100%",
                                justifyContent: "start",
                            }}
                        />
                    </CreateOneYear>
                )}
            </Popover.Content>
        </Popover.Root>
    )
}
