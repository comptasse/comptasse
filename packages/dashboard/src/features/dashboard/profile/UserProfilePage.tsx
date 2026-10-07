import { readUserSessionRouteDefinition } from "@comptasse/application-metadata/routes"
import { Button, ButtonOutlineContent } from "@comptasse/ui"
import { css } from "@comptasse/ui/utilities/cn.js"
import { IconKey, IconMail, IconTrash } from "@tabler/icons-react"
import { Block } from "../../../components/layouts/block/block.tsx"
import { DataWrapper } from "../../../components/layouts/DataWrapper.tsx"
import { DeleteUser } from "./DeleteUser.tsx"
import { UpdateUserEmail } from "./UpdateUserEmail.tsx"
import { UpdateUserPassword } from "./UpdateUserPassword.tsx"

export function UserProfilePage() {
    return (
        <div
            className={css({
                width: "100%",
                flex: "1",
                minHeight: "0",
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
                padding: "1.5rem",
            })}
        >
            <DataWrapper
                routeDefinition={readUserSessionRouteDefinition}
                body={{}}
            >
                {(userSession) => (
                    <div
                        className={css({
                            display: "flex",
                            flexDirection: "column",
                            gap: "1.5rem",
                        })}
                    >
                        <Block.Root>
                            <Block.Header title="Informations du compte" />
                            <Block.Row
                                title="Adresse email"
                                description={userSession.user.email}
                            >
                                <UpdateUserEmail>
                                    <Button>
                                        <ButtonOutlineContent
                                            leftIcon={<IconMail />}
                                            text="Modifier"
                                        />
                                    </Button>
                                </UpdateUserEmail>
                            </Block.Row>
                        </Block.Root>

                        <Block.Root>
                            <Block.Header title="Mot de passe" />
                            <Block.Row
                                title="Modifier le mot de passe"
                                description="Mettez à jour le mot de passe de votre compte."
                            >
                                <UpdateUserPassword>
                                    <Button>
                                        <ButtonOutlineContent
                                            leftIcon={<IconKey />}
                                            text="Modifier"
                                        />
                                    </Button>
                                </UpdateUserPassword>
                            </Block.Row>
                        </Block.Root>

                        <Block.Root variant="danger">
                            <Block.Header
                                title="Zone de danger"
                                variant="danger"
                            />
                            <Block.Row
                                title="Supprimer le compte"
                                description="Cette action est irréversible. Toutes vos données seront supprimées."
                                variant="danger"
                            >
                                <DeleteUser>
                                    <Button>
                                        <ButtonOutlineContent
                                            leftIcon={<IconTrash />}
                                            text="Supprimer"
                                            color="danger"
                                        />
                                    </Button>
                                </DeleteUser>
                            </Block.Row>
                        </Block.Root>
                    </div>
                )}
            </DataWrapper>
        </div>
    )
}
