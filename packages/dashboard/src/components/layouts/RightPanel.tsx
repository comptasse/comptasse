import { css } from "@comptasse/ui/utilities/cn.js"
import { IconX } from "@tabler/icons-react"
import type { ReactNode } from "react"

export function RightPanel(props: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
    if (!props.open) return null

    return (
        <div
            className={css({
                position: "fixed",
                inset: 0,
                display: "flex",
                justifyContent: "flex-end",
                zIndex: 50,
            })}
        >
            <button
                type="button"
                aria-label="Fermer le panneau"
                tabIndex={-1}
                className={css({
                    position: "absolute",
                    inset: 0,
                    backgroundColor: "rgba(0,0,0,0.3)",
                    border: 0,
                    padding: 0,
                    cursor: "pointer",
                })}
                onClick={props.onClose}
            />
            <div
                className={css({
                    position: "relative",
                    width: "32rem",
                    maxWidth: "100vw",
                    height: "100vh",
                    backgroundColor: "white",
                    display: "flex",
                    flexDirection: "column",
                    boxShadow: "-4px 0 24px rgba(0,0,0,0.1)",
                    overflow: "hidden",
                })}
            >
                <div
                    className={css({
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "1rem 1.5rem",
                        borderBottom: "1px solid",
                        borderBottomColor: "neutral/10",
                        flexShrink: 0,
                    })}
                >
                    <h2
                        className={css({
                            fontSize: "lg",
                            fontWeight: "semibold",
                        })}
                    >
                        {props.title}
                    </h2>
                    <button
                        type="button"
                        aria-label="Fermer"
                        onClick={props.onClose}
                        className={css({
                            padding: "0.25rem",
                            border: "none",
                            backgroundColor: "transparent",
                            cursor: "pointer",
                        })}
                    >
                        <IconX size={20} />
                    </button>
                </div>
                <div
                    className={css({
                        flex: 1,
                        overflowY: "auto",
                        padding: "1.5rem",
                    })}
                >
                    {props.children}
                </div>
            </div>
        </div>
    )
}
