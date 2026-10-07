import { createOneYearRouteDefinition, readAllYearsRouteDefinition } from "@comptasse/application-metadata/routes"
import { InputDate, InputText, toast } from "@comptasse/ui"
import { IconPlus } from "@tabler/icons-react"
import { Fragment } from "react/jsx-runtime"
import { useRightPanel } from "../../contexts/rightPanel/RightPanelContext.js"
import { YearSelect } from "../../features/dashboard/$idOrganization/years/YearSelect.js"
import { getResponseBodyFromAPI } from "../../utilities/getResponseBodyFromAPI.js"
import { invalidateData } from "../../utilities/invalidateData.js"
import { FormControl } from "../forms/FormControl.js"
import { FormError } from "../forms/FormError.js"
import { FormField } from "../forms/FormField.js"
import { FormItem } from "../forms/FormItem.js"
import { FormLabel } from "../forms/FormLabel.js"
import { FormRoot } from "../forms/FormRoot.js"

export function CreateYearForm(props: { idOrganization: string }) {
    const { closePanel } = useRightPanel()
    const currentDate = new Date()

    return (
        <FormRoot
            schema={createOneYearRouteDefinition.schemas.body}
            defaultValues={{
                startingAt: new Date(currentDate.getFullYear(), 0, 1).toISOString(),
                endingAt: new Date(currentDate.getFullYear(), 11, 31).toISOString(),
                label: undefined,
            }}
            submitButtonProps={{
                leftIcon: <IconPlus />,
                text: "Ajouter l'exercice",
            }}
            onSubmit={async (data) => {
                const response = await getResponseBodyFromAPI({
                    routeDefinition: createOneYearRouteDefinition,
                    body: data,
                })
                if (!response.ok) {
                    toast({
                        title: "Impossible de créer l'exercice",
                        variant: "error",
                    })
                    return false
                }
                toast({
                    title: "Exercice créé avec succès",
                    variant: "success",
                })
                return true
            }}
            onCancel={undefined}
            onSuccess={async () => {
                await invalidateData({
                    routeDefinition: readAllYearsRouteDefinition,
                    body: {},
                    params: {
                        idOrganization: props.idOrganization,
                    },
                })
                closePanel()
            }}
        >
            {(form) => (
                <Fragment>
                    <FormField
                        control={form.control}
                        name="startingAt"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel
                                    label="Date de début"
                                    isRequired={true}
                                />
                                <FormControl>
                                    <InputDate
                                        value={field.value}
                                        onChange={field.onChange}
                                    />
                                </FormControl>
                                <FormError />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="endingAt"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel
                                    label="Date de fin"
                                    isRequired={true}
                                />
                                <FormControl>
                                    <InputDate
                                        value={field.value}
                                        onChange={field.onChange}
                                    />
                                </FormControl>
                                <FormError />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="idYearPrevious"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel
                                    label="Exercice précédent ?"
                                    isRequired={false}
                                />
                                <FormControl>
                                    <YearSelect
                                        idOrganization={props.idOrganization}
                                        value={field.value}
                                        onChange={field.onChange}
                                    />
                                </FormControl>
                                <FormError />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="label"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel
                                    label="Libellé de l'exercice"
                                    isRequired={false}
                                />
                                <FormControl>
                                    <InputText
                                        value={field.value}
                                        onChange={field.onChange}
                                    />
                                </FormControl>
                                <FormError />
                            </FormItem>
                        )}
                    />
                </Fragment>
            )}
        </FormRoot>
    )
}
