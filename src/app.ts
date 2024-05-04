import "dotenv/config"

import { createBot, createProvider, createFlow, addKeyword, EVENTS, addAnswer } from '@builderbot/bot'
import { MemoryDB as Database } from '@builderbot/bot'
import { BaileysProvider as Provider } from '@builderbot/provider-baileys'
import { toAsk, httpInject } from "@builderbot-plugins/openai-assistants"
import { typing } from "./utils/presence"

const PORT = process.env?.PORT ?? 3008
const ASSISTANT_ID = process.env?.ASSISTANT_ID ?? ''

const mainFlow = addKeyword('hello')
  .addAnswer('This message will after 2 seconds',
    { delay: 5000 }
  )

const welcomeFlow = addKeyword<Provider, Database>(EVENTS.WELCOME)
    .addAnswer('',
        { delay: 5000 })
    .addAction(async (ctx, { flowDynamic, state, provider }) => {
        await typing(ctx, provider)
        const response = await toAsk(ASSISTANT_ID, ctx.body, state)
        const chunks = response.split(/(?<!\bDr|\d)\.\s+/g);
        for (const chunk of chunks) {
            await flowDynamic([{ body: chunk.trim() }]);
        }
    })

const main = async () => {
    const adapterFlow = createFlow([mainFlow, welcomeFlow])
    const adapterProvider = createProvider(Provider)
    const adapterDB = new Database()

    const { httpServer } = await createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    })

    httpInject(adapterProvider.server)
    httpServer(+PORT)
}

main()