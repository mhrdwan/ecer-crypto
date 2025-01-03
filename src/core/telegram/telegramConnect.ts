import { Telegraf, Markup } from "telegraf";
import dotenv from "dotenv";
import { getPriceBNB, getPriceMATIC, getPriceSol } from "../api/coinPrice";
import { getCyreency } from "../api/currency";
import { midtransCreate } from "../../controller/midtransController";
import { checkSolBalance } from "../coin/solana";
import Users from "../../models/User";
import { PPN } from "../../const/constants";
import { checkPolygonBalance } from "../coin/polygon";
import { checkBnbBalance } from "../coin/bnb";

dotenv.config();

const bot = new Telegraf(process.env.API_TELEGRAM_BOT as string);

let userState: Record<
  number,
  {
    totalPriceIDR: number;
    amountSOL: number;
    pendingWalletAddress?: string;
    walletAddress?: string;
  }
> = {};

let solPriceUSD: number = 0;

export async function telegram({ url }: { url?: string }) {
  const rateUSDToIDR = await getCyreency();
  try {
    bot.start(async (ctx) => {
      const balanceSolana = await checkSolBalance();
      const balanceMatic = Number(await checkPolygonBalance());
      const balanceBnb = Number(await checkBnbBalance());
      const priceSol = Number(await getPriceSol());
      const priceBNB = Number(await getPriceBNB());
      const priceMATIC = Number(await getPriceMATIC());
      const totalIDRSOL = priceSol * balanceSolana * rateUSDToIDR.IDR;
      const totalIDRBNB = priceBNB * balanceBnb * rateUSDToIDR.IDR;
      const totalIDRMATIC = priceMATIC * balanceMatic * rateUSDToIDR.IDR;
      try {
        const telegramId = ctx.from.id;
        const name = ctx.from.first_name || "User";

        const existingUser = await Users.findOne({ telegramId });
        console.log(existingUser);
        if (existingUser) {
          console.log(`Pengguna ${name} (${telegramId}) sudah terdaftar.`);
        } else {
          const newUser = new Users({ telegramId, name });
          await newUser.save();
          console.log(
            `Pengguna baru ${name} (${telegramId}) berhasil ditambahkan.`
          );
        }

        await ctx.replyWithHTML(
          `🌟 <b>Bakul Ecer Crypto</b> 🌟\n\n` +
            `Kami hadir untuk mempermudah Anda dalam melakukan top-up <b>crypto eceran</b> dengan berbagai pilihan koin populer:\n\n` +
            `- <b>Solana $${priceSol} / $SOL</b> \n- Stok: <b>${balanceSolana}\n- IDR: Rp${totalIDRSOL.toLocaleString(
              "id-ID"
            )}</b>\n\n` +
            `- <b>BNB $${priceBNB} / $BNB</b> \n- Stock : <b>${balanceBnb}\n- IDR: Rp${totalIDRBNB.toLocaleString(
              "id-ID"
            )}</b>\n\n` +
            `- <b>Polygon $${priceMATIC} / $MATIC</b> \n- Stock : <b>${parseFloat(balanceMatic.toFixed(2))}\n- IDR: Rp${totalIDRMATIC.toLocaleString(
              "id-ID"
            )}</b>\n\n` +
            `💵 <b>Pilihan Metode Pembayaran:</b>\n` +
            `✔️ QRIS\n` +
            `✔️ Transfer Bank\n` +
            `✔️ Opsi lain (hubungi admin)\n\n` +
            `🛒 <b>Silakan beli koin pilihan Anda dari menu di bawah ini:</b>\n\n` +
            `✨ <i>Terima kasih atas kepercayaan Anda, semoga transaksi Anda berjalan lancar!</i> ✨`,
          Markup.inlineKeyboard([
            [Markup.button.callback("💰 Beli Solana (SOL)", "solana")],
            [Markup.button.callback("💰 Beli BNB (BNB)", "bnb")],
            [Markup.button.callback("💰 Beli Polygon (MATIC)", "matic")],
            [Markup.button.callback("📞 Hubungi Admin", "dev")],
          ])
        );
      } catch (error) {
        console.error("Error in bot.start:", error);
        await ctx.reply("Maaf, terjadi kesalahan. Coba lagi nanti.");
      }
    });

    bot.action("saldo", async (ctx) => {
      const balanceSolana = await checkSolBalance();
      await ctx.replyWithHTML(
        `💰 <b>Saldo Wallet Penampung</b>\n\n` +
          `📍 Saldo saat ini: <b>${balanceSolana} $SOL </b>\n` +
          `✨ Gunakan layanan kami untuk transaksi yang cepat dan aman!`
      );
    });

    bot.action("solana", async (ctx) => {
      const price = Number(await getPriceSol());
      if (price) {
        solPriceUSD = parseFloat(price as any);
        await ctx.replyWithHTML(
          `📢 <b>Top-Up Solana (SOL)</b>\n\n` +
            `Harga Solana saat ini adalah <b>$${price} = Rp${Number(
              price * rateUSDToIDR.IDR
            ).toLocaleString("id-ID")}</b>\n\n` +
            `Silakan ketik jumlah SOL yang ingin Anda beli (contoh: <b>2.5</b> SOL).`
        );
        const userId = ctx.from?.id;
        if (userId) {
          userState[userId] = {
            totalPriceIDR: 0,
            amountSOL: 0,
          };
        }
      } else {
        await ctx.replyWithHTML(
          `⚠️ <b>Error:</b> Tidak dapat mengambil harga Solana saat ini. Coba lagi nanti.`
        );
      }
    });

    bot.on("text", async (ctx) => {
      const balanceSolana = await checkSolBalance();
      const userId = ctx.from?.id;
      if (!userId) return;

      const state = userState[userId];

      if (state && state.amountSOL === 0 && state.totalPriceIDR === 0) {
        const amountSOL = parseFloat(ctx.message.text);
        if (isNaN(amountSOL) || amountSOL <= 0) {
          await ctx.replyWithHTML(
            `⚠️ <b>Input tidak valid</b>. Silakan masukkan jumlah SOL yang benar.`
          );
          return;
        }
        if (amountSOL >= balanceSolana) {
          await ctx.replyWithHTML(
            `⚠️ <b>Harga tidak valid</b>. Jumlah token yang di beli lebih besar dari total token wallet penampung.`
          );
          return;
        }

        const totalPriceIDR = Math.ceil(
          amountSOL * solPriceUSD * rateUSDToIDR.IDR
        );

        // Update state pengguna
        userState[userId] = {
          ...state,
          totalPriceIDR,
          amountSOL,
        };

        await ctx.replyWithHTML(
          `💰 <b>Total Harga</b>\n\n` +
            `Jumlah: <b>${amountSOL} SOL</b>\n` +
            `Harga per SOL: <b>Rp ${(
              solPriceUSD * rateUSDToIDR.IDR
            ).toLocaleString("id-ID")}</b>\n` +
            `Total yang akan dibayarkan: <b>Rp ${Math.round(
              totalPriceIDR * (1 + PPN)
            ).toLocaleString("id-ID")}</b>\n\n` +
            `Apakah Anda ingin melanjutkan pembelian ini?`,
          Markup.inlineKeyboard([
            [
              Markup.button.callback("✅ Setuju", "setujuSOL"),
              Markup.button.callback("❌ Tidak", "tidak"),
            ],
          ])
        );
      } else if (
        state &&
        state.walletAddress === undefined &&
        state.amountSOL > 0 &&
        state.totalPriceIDR > 0 &&
        !state.pendingWalletAddress
      ) {
        const walletAddress = ctx.message.text.trim();

        userState[userId].pendingWalletAddress = walletAddress;

        await ctx.replyWithHTML(
          `🔍 <b>Konfirmasi Alamat Wallet</b>\n\n` +
            `Apakah alamat wallet ini sudah benar?\n\n` +
            `<code>${walletAddress}</code>`,
          Markup.inlineKeyboard([
            [
              Markup.button.callback("✅ Ya", "confirmWallet"),
              Markup.button.callback("❌ Tidak", "cancelWalletConfirmation"),
            ],
          ])
        );
      }
    });

    bot.action("setujuSOL", async (ctx) => {
      const userId = ctx.from?.id;

      if (!userId || !userState[userId]?.totalPriceIDR) {
        await ctx.replyWithHTML(
          "⚠️ Data transaksi tidak ditemukan. Silakan ulangi proses pembelian."
        );
        return;
      }

      await ctx.replyWithHTML(
        `🔐 <b>Masukkan alamat wallet Solana Anda</b>\n\n` +
          `Contoh: <code>Dg87PANMcdzruvd1rqiYL1oaL4ZrpiHoLNNSwfcNWNPC</code>`
      );
    });

    bot.action("confirmWallet", async (ctx) => {
      const userId = ctx.from?.id;
      const chatId = ctx.chat?.id;
      const name = ctx.from.first_name;
      if (!userId || !userState[userId]?.pendingWalletAddress) {
        await ctx.replyWithHTML(
          "⚠️ Alamat wallet tidak ditemukan. Silakan ulangi proses pembelian."
        );
        return;
      }

      const walletAddress = userState[userId].pendingWalletAddress;

      await ctx.replyWithHTML(
        `✅ <b>Alamat wallet Anda telah dikonfirmasi:</b>\n<code>${walletAddress}</code>\n\n` +
          `Sedang memproses transaksi...`
      );

      try {
        const userName = ctx.from?.first_name || "Pengguna";
        const { totalPriceIDR, amountSOL } = userState[userId];

        await midtransCreate({
          chatId,
          userId,
          name,
          coin: "solana",
          cusName: userName,
          email: `ridwan@gmail.com`,
          total: totalPriceIDR,
          addressWallet: walletAddress,
          token: "solana",
          jumlahToken: amountSOL,
        });

        userState[userId].walletAddress = walletAddress;

        delete userState[userId].pendingWalletAddress;

        delete userState[userId];
      } catch (error) {
        console.error("Error processing transaction:", error);
        await ctx.replyWithHTML(
          "⚠️ Maaf, terjadi kesalahan saat memproses transaksi. Silakan coba lagi nanti."
        );
        delete userState[userId];
      }
    });

    bot.action("cancelWalletConfirmation", async (ctx) => {
      const userId = ctx.from?.id;

      if (!userId || !userState[userId]?.pendingWalletAddress) {
        await ctx.replyWithHTML(
          "⚠️ Alamat wallet tidak ditemukan. Silakan ulangi proses pembelian."
        );
        return;
      }

      // Hapus pendingWalletAddress
      delete userState[userId].pendingWalletAddress;

      await ctx.replyWithHTML(
        `❌ <b>Alamat wallet dibatalkan.</b>\n` +
          `Silakan masukkan ulang alamat wallet Solana Anda.\n\n` +
          `Contoh: <code>SXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX</code>`
      );
    });

    // Handler untuk aksi "tidak"
    bot.action("tidak", async (ctx) => {
      const userId = ctx.from?.id;
      if (userId && userState[userId]) {
        delete userState[userId];
      }

      await ctx.replyWithHTML(
        `❌ <b>Pembelian dibatalkan.</b>\n` +
          `Anda dapat memulai kembali proses pembelian kapan saja dengan memilih koin yang diinginkan.`
      );
    });

    // Handler untuk pilihan koin lainnya
    bot.action("ethereum", async (ctx) => {
      await ctx.replyWithHTML(
        `📢 <b>Top-Up Ethereum (ETH)</b>\n\n` +
          `Silakan masukkan jumlah ETH yang ingin Anda beli. Kami akan memberikan detail pembayaran setelahnya.`
      );
      // Anda bisa mengimplementasikan alur yang serupa untuk Ethereum
    });

    bot.action("usdt", async (ctx) => {
      await ctx.replyWithHTML(
        `📢 <b>Top-Up USDT (Tether)</b>\n\n` +
          `Silakan masukkan jumlah USDT yang ingin Anda beli. Kami akan memberikan detail pembayaran setelahnya.`
      );
      // Anda bisa mengimplementasikan alur yang serupa untuk USDT
    });

    bot.action("bnb", async (ctx) => {
      await ctx.replyWithHTML(
        `📢 <b>Top-Up BNB (Binance Coin)</b>\n\n` +
          `Silakan masukkan jumlah BNB yang ingin Anda beli. Kami akan memberikan detail pembayaran setelahnya.`
      );
      // Anda bisa mengimplementasikan alur yang serupa untuk BNB
    });

    // Handler untuk menghubungi admin
    bot.action("dev", async (ctx) => {
      await ctx.replyWithHTML(
        `📞 <b>Hubungi Admin</b>\n\n` +
          `Untuk informasi lebih lanjut atau pertanyaan lain, silakan hubungi kami melalui:\n` +
          `- 📱 <b>Telegram:</b> @ridwantech\n\n` +
          `Kami siap membantu Anda!`
      );
    });
  } catch (err) {
    console.error("Error in Telegram bot:", err);
  }

  // Meluncurkan bot
  bot.launch();

  // Menangani sinyal untuk menghentikan bot
  process.once("SIGINT", () => bot.stop("SIGINT"));
  process.once("SIGTERM", () => bot.stop("SIGTERM"));
}
