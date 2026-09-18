import { ButtonOutlineContent } from "@comptasse/ui/components/buttons/ButtonOutlineContent.js"
import { css } from "@comptasse/ui/utilities/cn.js"
import { IconBook2, IconHome } from "@tabler/icons-react"
import { LinkButton } from "../../components/LinkButton.js"

export function NotFoundPage() {
    return (
        <div
            className={css({
                width: "100%",
                minHeight: "100vh",
                display: "flex",
                flexDirection: "column",
                backgroundColor: "background",
            })}
        >
            <div
                className={css({
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    paddingX: "1rem",
                    paddingY: "4rem",
                })}
            >
                <div
                    className={css({
                        maxWidth: "sm",
                        width: "100%",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "2rem",
                        textAlign: "center",
                    })}
                >
                    <span
                        className={css({
                            fontSize: "5xl",
                            fontWeight: "bold",
                            color: "neutral/15",
                            lineHeight: 1,
                        })}
                    >
                        404
                    </span>
                    <div
                        className={css({
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.5rem",
                        })}
                    >
                        <h1
                            className={css({
                                fontSize: "lg",
                                fontWeight: "bold",
                                color: "neutral",
                            })}
                        >
                            Page introuvable
                        </h1>
                        <p
                            className={css({
                                fontSize: "sm",
                                color: "neutral/60",
                                lineHeight: "1.6",
                            })}
                        >
                            La page que vous recherchez n'existe pas ou a été déplacée.
                        </p>
                    </div>
                    <div
                        className={css({
                            display: "flex",
                            flexDirection: "row",
                            gap: "0.75rem",
                        })}
                    >
                        <LinkButton to="/">
                            <ButtonOutlineContent
                                text="Accueil"
                                leftIcon={<IconHome />}
                            />
                        </LinkButton>
                        <LinkButton to="/documentation/fonctionnalités">
                            <ButtonOutlineContent
                                text="Documentation"
                                leftIcon={<IconBook2 />}
                            />
                        </LinkButton>
                    </div>
                </div>
            </div>
        </div>
    )
}
