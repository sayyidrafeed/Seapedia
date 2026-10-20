import {
  connect as amqpConnect,
  type Channel,
  type ChannelModel,
  type ConfirmChannel,
} from 'amqplib';
import { EXCHANGE, REDELIVER_EXCHANGE, RETRY_EXCHANGE } from './envelope';

export type RabbitOptions = { url: string; service: string };

/**
 * One AMQP connection per process, reopened after failures. Channels are created on demand and
 * dropped with the connection, so callers just ask again after an error.
 */
export function createRabbit({ url, service }: RabbitOptions) {
  let connection: Promise<ChannelModel> | null = null;
  let confirm: Promise<ConfirmChannel> | null = null;

  function reset() {
    connection = null;
    confirm = null;
  }

  async function connect(): Promise<ChannelModel> {
    if (!connection) {
      connection = amqpConnect(url, { clientProperties: { connection_name: service } })
        .then((conn) => {
          conn.on('error', (err) =>
            console.error(JSON.stringify({ service, rabbit: 'error', error: String(err) })),
          );
          conn.on('close', reset);
          return conn;
        })
        .catch((err) => {
          reset();
          throw err;
        });
    }
    return connection;
  }

  async function declareExchanges(channel: Channel) {
    await channel.assertExchange(EXCHANGE, 'topic', { durable: true });
    await channel.assertExchange(RETRY_EXCHANGE, 'direct', { durable: true });
    await channel.assertExchange(REDELIVER_EXCHANGE, 'direct', { durable: true });
  }

  return {
    connect,
    /** Channel with publisher confirms, shared by the outbox relay. */
    async confirmChannel(): Promise<ConfirmChannel> {
      if (!confirm) {
        confirm = connect()
          .then(async (conn) => {
            const ch = await conn.createConfirmChannel();
            ch.on('close', () => {
              confirm = null;
            });
            ch.on('error', () => undefined);
            await declareExchanges(ch);
            return ch;
          })
          .catch((err) => {
            confirm = null;
            throw err;
          });
      }
      return confirm;
    },
    /** A fresh channel for one consumer. */
    async channel(): Promise<Channel> {
      const ch = await (await connect()).createChannel();
      ch.on('error', () => undefined);
      await declareExchanges(ch);
      return ch;
    },
    async close() {
      const conn = connection;
      reset();
      if (conn) await (await conn).close().catch(() => undefined);
    },
  };
}

export type Rabbit = ReturnType<typeof createRabbit>;
