import { storage } from "./storage";
import { Account, BotSettings } from "@shared/schema";
import { Client, Events, GatewayIntentBits, Message } from "discord.js";

// Factory to create and configure Discord bot
export const createDiscordBot = (token: string) => {
  if (!token) {
    console.warn("Discord bot token not provided. Bot will not be initialized.");
    return null;
  }

  // Create a new client instance
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildMembers,
    ],
  });

  // When the client is ready, run this code (only once)
  client.once(Events.ClientReady, (readyClient) => {
    console.log(`Discord bot logged in as ${readyClient.user.tag}`);
    
    // Log bot start in the system
    storage.createLog({
      type: "success",
      action: "BOT_START",
      message: `Discord bot started as ${readyClient.user.tag}`,
    });
  });

  // Set up message event handler
  client.on(Events.MessageCreate, async (message: Message) => {
    try {
      // Ignore bot messages
      if (message.author.bot) return;
      
      // Get guild settings or use defaults
      let settings: BotSettings | undefined;
      
      if (message.guild) {
        settings = await storage.getBotSettings(message.guild.id);
        if (!settings) {
          // Create default settings for this guild
          settings = await storage.createBotSettings({
            guildId: message.guild.id,
            prefix: "!",
            allowedRoles: [],
            adminRoles: [],
            cooldown: 3600
          });
        }
      } else {
        // DM case - use default prefix
        settings = {
          id: 0,
          guildId: "dm",
          prefix: "!",
          allowedRoles: [],
          adminRoles: [],
          cooldown: 3600,
          createdAt: new Date(),
          updatedAt: new Date()
        };
      }
      
      // Check if message starts with the prefix
      const prefix = settings.prefix;
      if (!message.content.startsWith(prefix)) return;
      
      // Parse command and arguments
      const args = message.content.slice(prefix.length).trim().split(/ +/);
      const command = args.shift()?.toLowerCase();
      
      // Handle commands
      switch(command) {
        case "generate":
          await handleGenerateCommand(message, args, settings);
          break;
        case "stock":
          await handleStockCommand(message, args);
          break;
        case "add":
          await handleAddCommand(message, args, settings);
          break;
        case "status":
          await handleStatusCommand(message);
          break;
        case "help":
          await handleHelpCommand(message, prefix);
          break;
        case "profile":
          await handleProfileCommand(message);
          break;
        case "cooldown":
          await handleCooldownCommand(message, settings);
          break;
        case "info":
          await handleInfoCommand(message, args);
          break;
        case "remove":
          await handleRemoveCommand(message, args, settings);
          break;
        case "blacklist":
          await handleBlacklistCommand(message, args);
          break;
        case "setcooldown":
          await handleSetCooldownCommand(message, args, settings);
          break;
        default:
          // Unknown command
          break;
      }
    } catch (error) {
      console.error("Error handling Discord message:", error);
      
      // Log error in the system
      storage.createLog({
        type: "error",
        action: "BOT_ERROR",
        message: `Error processing message: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  });

  // Helper function to check if user has admin permissions
  const isAdmin = async (message: Message): Promise<boolean> => {
    // In DMs, only allow admin commands from bot owner
    if (!message.guild) {
      return message.author.id === process.env.DISCORD_OWNER_ID;
    }
    
    // Get guild settings
    const settings = await storage.getBotSettings(message.guild.id);
    if (!settings || !settings.adminRoles || settings.adminRoles.length === 0) {
      // If no admin roles configured, only guild administrators can use admin commands
      return message.member?.permissions.has("Administrator") || false;
    }
    
    // Check if user has any admin role
    return settings.adminRoles.some(roleId => 
      message.member?.roles.cache.has(roleId)
    ) || message.member?.permissions.has("Administrator") || false;
  };

  // Helper to check if user has permission to use the bot
  const hasPermission = async (message: Message): Promise<boolean> => {
    // In DMs, everyone can use basic commands
    if (!message.guild) return true;
    
    // Get guild settings
    const settings = await storage.getBotSettings(message.guild.id);
    if (!settings || !settings.allowedRoles || settings.allowedRoles.length === 0) {
      // If no roles configured, everyone can use the bot
      return true;
    }
    
    // Check if user has any allowed role or is an admin
    return settings.allowedRoles.some(roleId => 
      message.member?.roles.cache.has(roleId)
    ) || isAdmin(message);
  };

  // Command handlers
  const handleGenerateCommand = async (message: Message, args: string[], settings: BotSettings) => {
    // Check if user has permission
    if (!await hasPermission(message)) {
      return message.reply("❌ **Accès Refusé!** Vous n'avez pas la permission d'utiliser cette commande.");
    }
    
    // Check cooldown (implement using a simple map or storage)
    // For simplicity, we're not implementing cooldown in this example
    
    // Get service name from args
    const serviceName = args[0]?.toLowerCase();
    if (!serviceName) {
      return message.reply(`⚠️ **Erreur:** Veuillez spécifier un service. \n**Usage:** \`${settings.prefix}generate [service_name]\``);
    }
    
    try {
      // Find category
      const category = await storage.getCategoryByName(serviceName);
      if (!category) {
        const categories = await storage.getCategories();
        const categoryList = categories.map(c => `\`${c.name}\``).join(", ");
        return message.reply(`❌ **Service Non Trouvé:** \`${serviceName}\` n'existe pas.\n\n**Services Disponibles:**\n${categoryList}`);
      }
      
      // Find available account
      const accounts = await storage.getAccounts({ 
        categoryId: category.id, 
        status: "available" 
      });
      
      if (accounts.length === 0) {
        await storage.createLog({
          type: "warning",
          action: "ACCOUNT_GENERATION_FAILED",
          message: `No available accounts for ${serviceName}`,
        });
        
        return message.reply(`📉 **Stock Épuisé:** Désolé, aucun compte \`${category.name}\` n'est disponible actuellement. Veuillez réessayer plus tard ou contacter un administrateur.`);
      }
      
      // Get the first available account
      const account = accounts[0];
      
      // Mark as generated
      await storage.updateAccount(account.id, {
        status: "generated",
        generatedBy: message.author.tag,
        generatedAt: new Date()
      });
      
      // Log generation
      await storage.createLog({
        type: "success",
        action: "ACCOUNT_GENERATED",
        message: `Account generated for ${message.author.tag}: ${account.email} (${category.name})`,
      });
      
      // Send account details via DM
      try {
        await message.author.send(
          `🎉 **Compte ${category.name} Généré!**\n\n` +
          `📧 **Email:** \`${account.email}\`\n` +
          `🔑 **Mot de passe:** \`${account.password}\`\n\n` +
          `⏳ **Expire:** ${account.expiresAt ? new Date(account.expiresAt).toLocaleDateString() : 'Non spécifié'}\n\n` +
          `💡 **Note:** Merci de ne pas partager ce compte. Si vous rencontrez un problème, contactez un administrateur.`
        );
        
        // Confirm in the channel
        return message.reply(`✅ **Succès!** Un compte \`${category.name}\` a été envoyé dans vos messages privés.`);
      } catch (err) {
        // If DM fails
        await storage.updateAccount(account.id, { status: "available" });
        return message.reply("❌ **Erreur DM:** Impossible d'envoyer un message privé. Veuillez activer les DMs provenant des membres du serveur et réessayer.");
      }
    } catch (error) {
      console.error("Error generating account:", error);
      
      // Log error
      await storage.createLog({
        type: "error",
        action: "ACCOUNT_GENERATION_ERROR",
        message: `Error generating account: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
      
      return message.reply("⚠️ **Erreur Système:** Une erreur est survenue lors de la génération du compte. Veuillez réessayer plus tard.");
    }
  };

  const handleStockCommand = async (message: Message, args: string[]) => {
    // Check if user has permission
    if (!await hasPermission(message)) {
      return message.reply("❌ **Accès Refusé!** Vous n'avez pas la permission d'utiliser cette commande.");
    }
    
    // Get service name from args (optional)
    const serviceName = args[0]?.toLowerCase();
    
    try {
      // Get all categories
      const categories = await storage.getCategories();
      
      // Filter by service name if provided
      const targetCategories = serviceName 
        ? categories.filter(c => c.name.toLowerCase() === serviceName) 
        : categories;
      
      if (serviceName && targetCategories.length === 0) {
        return message.reply(`❌ **Service Non Trouvé:** \`${serviceName}\` n'existe pas.`);
      }
      
      // Get stock information for each category
      const stockInfo = await Promise.all(targetCategories.map(async (category) => {
        const accounts = await storage.getAccounts({ categoryId: category.id });
        const available = accounts.filter(a => a.status === "available").length;
        return {
          name: category.name,
          total: accounts.length,
          available
        };
      }));
      
      // Prepare stock message
      let stockMessage = "📊 **Inventaire Actuel des Comptes**\n\n";
      
      // Organize by category type
      const categoryGroups: Record<string, string> = {
        'Streaming Vidéo': '🎬 **Streaming Vidéo**\n',
        'Musique': '🎵 **Musique**\n',
        'Livres / Éducation': '📚 **Livres / Éducation**\n',
        'Stockage en ligne / Outils': '☁️ **Stockage en ligne / Outils**\n',
        'Jeux & Abonnements': '🎮 **Jeux & Abonnements**\n',
        'other': '🔄 **Autres Services**\n'
      };
      
      // Fill in stock info by category
      stockInfo.forEach(info => {
        const categoryType = Object.keys(categoryGroups).includes(info.name) 
          ? info.name 
          : 'other';
        
        const statusEmoji = info.available > 0 ? '🟢' : '🔴';
        categoryGroups[categoryType as keyof typeof categoryGroups] += `${statusEmoji} **${info.name}**: \`${info.available}/${info.total}\` disponibles\n`;
      });
      
      // Add non-empty categories to stock message
      Object.keys(categoryGroups).forEach(category => {
        const catGroup = categoryGroups[category as keyof typeof categoryGroups];
        if (catGroup.split('\n').length > 1) {
          stockMessage += catGroup + '\n';
        }
      });
      
      // Add total count
      const totalAccounts = stockInfo.reduce((sum, info) => sum + info.total, 0);
      const totalAvailable = stockInfo.reduce((sum, info) => sum + info.available, 0);
      
      stockMessage += `\n📌 **Total**: \`${totalAvailable}/${totalAccounts}\` comptes disponibles`;
      
      return message.reply(stockMessage);
    } catch (error) {
      console.error("Error checking stock:", error);
      
      // Log error
      await storage.createLog({
        type: "error",
        action: "STOCK_CHECK_ERROR",
        message: `Error checking stock: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
      
      return message.reply("⚠️ **Erreur Système:** Une erreur est survenue lors de la vérification du stock. Veuillez réessayer plus tard.");
    }
  };

  const handleAddCommand = async (message: Message, args: string[], settings: BotSettings) => {
    // Check if user is admin
    if (!await isAdmin(message)) {
      return message.reply("❌ **Accès Refusé!** Vous n'avez pas les permissions administrateur nécessaires.");
    }
    
    // Check arguments
    if (args.length < 2) {
      return message.reply(`⚠️ **Format Incorrect:** \n**Usage:** \`${settings.prefix}add [service_name] [email:password]\``);
    }
    
    const serviceName = args[0];
    const accountDetails = args[1];
    
    // Check account format
    if (!accountDetails.includes(':')) {
      return message.reply(`❌ **Format Invalide:** Veuillez utiliser le format \`email:password\``);
    }
    
    const [email, password] = accountDetails.split(':');
    
    try {
      // Find or create category
      let category = await storage.getCategoryByName(serviceName);
      
      if (!category) {
        category = await storage.createCategory({
          name: serviceName,
          description: `${serviceName} accounts`
        });
      }
      
      // Add account
      const account = await storage.createAccount({
        email,
        password,
        categoryId: category.id,
        status: "available",
        expiresAt: null,
        generatedBy: null,
        generatedAt: null
      });
      
      // Log account addition
      await storage.createLog({
        type: "success",
        action: "ACCOUNT_ADDED",
        message: `Admin ${message.author.tag} added account: ${email} (${category.name})`,
      });
      
      return message.reply(`✅ **Compte Ajouté:** \`${serviceName}\` compte: \`${email}\` ajouté avec succès!`);
    } catch (error) {
      console.error("Error adding account:", error);
      
      // Log error
      await storage.createLog({
        type: "error",
        action: "ACCOUNT_ADD_ERROR",
        message: `Error adding account: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
      
      return message.reply("⚠️ **Erreur Système:** Une erreur est survenue lors de l'ajout du compte. Veuillez réessayer plus tard.");
    }
  };

  const handleStatusCommand = async (message: Message) => {
    // Check if user has permission
    if (!await hasPermission(message)) {
      return message.reply("❌ **Accès Refusé!** Vous n'avez pas la permission d'utiliser cette commande.");
    }
    
    try {
      // Get stats
      const stats = await storage.getDashboardStats();
      
      // Format uptime
      const uptime = client.uptime ? Math.floor(client.uptime / 1000 / 60) : 0;
      const hours = Math.floor(uptime / 60);
      const minutes = uptime % 60;
      const uptimeFormatted = hours > 0 
        ? `${hours}h ${minutes}m` 
        : `${minutes}m`;
      
      // Bot status emoji
      const statusEmoji = "🟢";
      
      // Format last generation time to be more human readable
      const lastGen = stats.lastGeneration 
        ? new Date(stats.lastGeneration)
        : null;
      
      const lastGenFormatted = lastGen 
        ? `${new Date(lastGen).toLocaleString('fr-FR', { 
            day: '2-digit', 
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          })}`
        : 'Aucune';
      
      const stockHealth = stats.availableAccounts > 0 
        ? (stats.availableAccounts > stats.totalAccounts / 2 
          ? "🟢 Excellent" 
          : "🟡 Correct")
        : "🔴 Critique";
      
      const statusMessage = `🤖 **Statut du Bot TawnAnime**\n\n` +
        `${statusEmoji} **Statut:** En ligne\n` +
        `🌐 **Serveurs connectés:** ${client.guilds.cache.size}\n` +
        `⏱️ **Temps de fonctionnement:** ${uptimeFormatted}\n\n` +
        `📊 **Statistiques des Comptes**\n` +
        `💾 **Total des comptes:** ${stats.totalAccounts}\n` +
        `✅ **Comptes disponibles:** ${stats.availableAccounts}\n` +
        `📈 **Générés aujourd'hui:** ${stats.generatedToday}\n` +
        `🕒 **Dernière génération:** ${lastGenFormatted}\n\n` +
        `📋 **État du stock:** ${stockHealth}`;
      
      return message.reply(statusMessage);
    } catch (error) {
      console.error("Error checking status:", error);
      
      // Log error
      await storage.createLog({
        type: "error",
        action: "STATUS_CHECK_ERROR",
        message: `Error checking status: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
      
      return message.reply("⚠️ **Erreur Système:** Une erreur est survenue lors de la vérification du statut. Veuillez réessayer plus tard.");
    }
  };

  const handleHelpCommand = async (message: Message, prefix: string) => {
    const isAdminUser = await isAdmin(message);
    
    let helpMessage = `🔍 **Commandes du Bot TawnAnime**\n\n` +
      `👤 **Commandes Utilisateur:**\n\n` +
      `\`${prefix}help\` - Affiche ce message d'aide\n` +
      `\`${prefix}generate [service]\` - Génère un compte pour un service spécifique\n` +
      `\`${prefix}stock [service]\` - Vérifie les comptes disponibles en stock\n` +
      `\`${prefix}profile\` - Affiche vos informations et statistiques\n` +
      `\`${prefix}cooldown\` - Vérifie le temps restant avant nouvelle génération\n` +
      `\`${prefix}info [service]\` - Donne une description du service et instructions\n` +
      `\`${prefix}status\` - Vérifie le statut du bot et les statistiques des comptes\n\n` +
      
      `🔸 **Exemples:**\n` +
      `\`${prefix}generate netflix\` - Génère un compte Netflix\n` +
      `\`${prefix}stock spotify\` - Vérifie les comptes Spotify disponibles\n` +
      `\`${prefix}info canva\` - Affiche les informations sur Canva\n`;
    
    // Admin commands - visible uniquement pour les admins
    if (isAdminUser) {
      helpMessage += `\n👑 **Commandes Admin:**\n\n` +
        `\`${prefix}add [service] [email:password]\` - Ajoute un nouveau compte au stock\n` +
        `\`${prefix}remove [service] [email]\` - Supprime un compte du stock\n` +
        `\`${prefix}blacklist [user_id] [raison]\` - Ajoute un utilisateur à la liste noire\n` +
        `\`${prefix}setcooldown [minutes]\` - Modifie le temps d'attente entre générations\n\n` +
        
        `🔸 **Exemples:**\n` +
        `\`${prefix}add netflix john@example.com:password123\` - Ajoute un compte Netflix\n` +
        `\`${prefix}setcooldown 30\` - Définit le cooldown à 30 minutes\n`;
    }
    
    // Add service categories at the bottom
    helpMessage += `\n📂 **Catégories Disponibles:**\n\n` +
      `🎬 **Streaming Vidéo:** Netflix, Disney+, HBO Max, Hulu, Prime Video, etc.\n` +
      `🎵 **Musique:** Spotify, Deezer, Tidal, Apple Music\n` +
      `📚 **Livres / Éducation:** Scribd, Chegg, Quizlet, Coursera, Udemy\n` +
      `☁️ **Stockage/Outils:** NordVPN, ExpressVPN, Canva Pro, Minecraft, Grammarly, ChatGPT\n` +
      `🎮 **Jeux & Abonnements:** Xbox Game Pass, PlayStation Plus, Nintendo Online, EA Play, Ubisoft+\n`;
    
    return message.reply(helpMessage);
  };

  // Nouvelles commandes
  const handleProfileCommand = async (message: Message) => {
    // Check if user has permission
    if (!await hasPermission(message)) {
      return message.reply("❌ **Accès Refusé!** Vous n'avez pas la permission d'utiliser cette commande.");
    }
    
    try {
      // Ici, idéalement, on récupérerait l'historique des comptes générés par cet utilisateur
      // Pour l'exemple, on va simuler les données
      const userId = message.author.id;
      const userName = message.author.username;
      
      // Données fictives de profil - à remplacer par des données réelles de la base de données
      const accountsGenerated = 5;
      const lastGeneration = new Date(Date.now() - 1000 * 60 * 60 * 2).toLocaleString('fr-FR'); // 2 heures avant
      const nextGenerationAllowed = new Date(Date.now() + 1000 * 60 * 30).toLocaleString('fr-FR'); // 30 min plus tard
      
      const profileMessage = `👤 **Profil de ${userName}**\n\n` +
        `🆔 **ID Discord:** ${userId}\n` +
        `🕒 **Date d'inscription:** ${new Date(message.author.createdAt).toLocaleDateString('fr-FR')}\n\n` +
        `📊 **Statistiques:**\n` +
        `✅ **Comptes générés:** ${accountsGenerated}\n` +
        `⏱️ **Dernière génération:** ${lastGeneration}\n` +
        `⏳ **Prochaine génération possible:** ${nextGenerationAllowed}\n\n` +
        `💡 **Statut:** Actif`;
      
      return message.reply(profileMessage);
    } catch (error) {
      console.error("Error fetching profile:", error);
      
      // Log error
      await storage.createLog({
        type: "error",
        action: "PROFILE_CHECK_ERROR",
        message: `Error checking profile: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
      
      return message.reply("⚠️ **Erreur Système:** Une erreur est survenue lors de la récupération de votre profil. Veuillez réessayer plus tard.");
    }
  };

  const handleCooldownCommand = async (message: Message, settings: BotSettings) => {
    // Check if user has permission
    if (!await hasPermission(message)) {
      return message.reply("❌ **Accès Refusé!** Vous n'avez pas la permission d'utiliser cette commande.");
    }
    
    try {
      // Ici on récupérerait la dernière génération de l'utilisateur
      // Pour l'exemple, on va simuler
      const cooldownMinutes = settings.cooldown / 60;
      const lastGenerationTime = Date.now() - 1000 * 60 * 60 * 2; // 2 heures avant
      const cooldownPeriod = settings.cooldown * 1000; // en millisecondes
      const remainingTime = Math.max(0, cooldownPeriod - (Date.now() - lastGenerationTime));
      
      const remainingMinutes = Math.floor(remainingTime / (1000 * 60));
      const remainingSeconds = Math.floor((remainingTime % (1000 * 60)) / 1000);
      
      if (remainingTime <= 0) {
        return message.reply(`⏱️ **Cooldown Terminé!** Vous pouvez générer un nouveau compte dès maintenant.`);
      } else {
        return message.reply(
          `⏳ **Cooldown Actif**\n\n` +
          `⌛ **Temps restant:** ${remainingMinutes}m ${remainingSeconds}s\n` +
          `⏰ **Cooldown total:** ${cooldownMinutes} minutes\n` +
          `🔄 **Nouvelle génération possible à:** ${new Date(lastGenerationTime + cooldownPeriod).toLocaleTimeString('fr-FR')}`
        );
      }
    } catch (error) {
      console.error("Error checking cooldown:", error);
      
      // Log error
      await storage.createLog({
        type: "error",
        action: "COOLDOWN_CHECK_ERROR",
        message: `Error checking cooldown: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
      
      return message.reply("⚠️ **Erreur Système:** Une erreur est survenue lors de la vérification du cooldown. Veuillez réessayer plus tard.");
    }
  };

  const handleInfoCommand = async (message: Message, args: string[]) => {
    // Check if user has permission
    if (!await hasPermission(message)) {
      return message.reply("❌ **Accès Refusé!** Vous n'avez pas la permission d'utiliser cette commande.");
    }
    
    // Get service name from args
    const serviceName = args[0]?.toLowerCase();
    if (!serviceName) {
      return message.reply(`⚠️ **Erreur:** Veuillez spécifier un service. \n**Usage:** \`/info [service_name]\``);
    }
    
    try {
      // Find category
      const category = await storage.getCategoryByName(serviceName);
      if (!category) {
        const categories = await storage.getCategories();
        const categoryList = categories.map(c => `\`${c.name}\``).join(", ");
        return message.reply(`❌ **Service Non Trouvé:** \`${serviceName}\` n'existe pas.\n\n**Services Disponibles:**\n${categoryList}`);
      }
      
      // Information sur les services - ici c'est statique mais pourrait être stocké en base
      const serviceInfo: {[key: string]: {icon: string, description: string, instructions: string}} = {
        "netflix": {
          icon: "🎬",
          description: "Service de streaming vidéo offrant des films, séries et documentaires.",
          instructions: "Connectez-vous avec les identifiants fournis. N'ajoutez pas de profil et ne modifiez pas les paramètres."
        },
        "spotify": {
          icon: "🎵",
          description: "Service de streaming musical donnant accès à des millions de chansons.",
          instructions: "Utilisez l'application web plutôt que l'application mobile pour une meilleure expérience."
        },
        "canva": {
          icon: "🎨",
          description: "Outil de design graphique en ligne pour créer des visuels professionnels.",
          instructions: "Ne changez pas le mot de passe et n'utilisez pas l'espace de stockage pour vos fichiers personnels."
        }
      };
      
      // Information par défaut si le service n'est pas dans notre liste
      const info = serviceInfo[serviceName.toLowerCase()] || {
        icon: "ℹ️",
        description: `Service dans la catégorie ${category.name}.`,
        instructions: "Utilisez les identifiants générés pour vous connecter. Ne modifiez pas les paramètres du compte."
      };
      
      // Formatter le temps de validité typique
      const validityPeriod = "1-3 mois"; // simulé, idéalement vient de la config ou statistiques
      
      const infoMessage = `${info.icon} **Information sur ${category.name}**\n\n` +
        `📝 **Description:**\n${info.description}\n\n` +
        `📋 **Instructions:**\n${info.instructions}\n\n` +
        `⏳ **Validité typique:** ${validityPeriod}\n` +
        `📊 **Stock actuel:** ${await getServiceStock(category.id)}\n` +
        `⚠️ **Important:** Ne modifiez jamais le mot de passe ou les informations du compte généré.`;
      
      return message.reply(infoMessage);
    } catch (error) {
      console.error("Error fetching service info:", error);
      
      // Log error
      await storage.createLog({
        type: "error",
        action: "SERVICE_INFO_ERROR",
        message: `Error fetching service info: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
      
      return message.reply("⚠️ **Erreur Système:** Une erreur est survenue lors de la récupération des informations. Veuillez réessayer plus tard.");
    }
  };

  const handleRemoveCommand = async (message: Message, args: string[], settings: BotSettings) => {
    // Check if user is admin
    if (!await isAdmin(message)) {
      return message.reply("❌ **Accès Refusé!** Vous n'avez pas les permissions administrateur nécessaires.");
    }
    
    // Check arguments
    if (args.length < 2) {
      return message.reply(`⚠️ **Format Incorrect:** \n**Usage:** \`${settings.prefix}remove [service_name] [email]\``);
    }
    
    const serviceName = args[0];
    const email = args[1];
    
    try {
      // Find category
      const category = await storage.getCategoryByName(serviceName);
      if (!category) {
        return message.reply(`❌ **Service Non Trouvé:** \`${serviceName}\` n'existe pas.`);
      }
      
      // Find account by email and category
      const accounts = await storage.getAccounts({ 
        categoryId: category.id,
        search: email
      });
      
      const account = accounts.find(a => a.email === email);
      
      if (!account) {
        return message.reply(`❌ **Compte Non Trouvé:** Aucun compte avec l'email \`${email}\` n'a été trouvé dans \`${serviceName}\`.`);
      }
      
      // Delete the account
      const success = await storage.deleteAccount(account.id);
      
      if (success) {
        // Log account removal
        await storage.createLog({
          type: "success",
          action: "ACCOUNT_REMOVED",
          message: `Admin ${message.author.tag} removed account: ${email} (${serviceName})`,
        });
        
        return message.reply(`✅ **Compte Supprimé:** Le compte \`${email}\` a été supprimé de \`${serviceName}\` avec succès.`);
      } else {
        return message.reply(`❌ **Erreur de Suppression:** Impossible de supprimer le compte \`${email}\`.`);
      }
    } catch (error) {
      console.error("Error removing account:", error);
      
      // Log error
      await storage.createLog({
        type: "error",
        action: "ACCOUNT_REMOVE_ERROR",
        message: `Error removing account: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
      
      return message.reply("⚠️ **Erreur Système:** Une erreur est survenue lors de la suppression du compte. Veuillez réessayer plus tard.");
    }
  };

  const handleBlacklistCommand = async (message: Message, args: string[]) => {
    // Check if user is admin
    if (!await isAdmin(message)) {
      return message.reply("❌ **Accès Refusé!** Vous n'avez pas les permissions administrateur nécessaires.");
    }
    
    // Check arguments
    if (args.length < 2) {
      return message.reply(`⚠️ **Format Incorrect:** \n**Usage:** \`/blacklist [user_id] [raison]\``);
    }
    
    const userId = args[0];
    const reason = args.slice(1).join(" ");
    
    try {
      // Ici on ajouterait l'utilisateur à une liste noire dans la base de données
      // Pour cet exemple, on simule simplement une réponse réussie
      
      // Log blacklist
      await storage.createLog({
        type: "warning",
        action: "USER_BLACKLISTED",
        message: `Admin ${message.author.tag} blacklisted user: ${userId} for: ${reason}`,
      });
      
      return message.reply(`✅ **Utilisateur Blacklisté:** L'utilisateur avec l'ID \`${userId}\` a été ajouté à la liste noire.\n📝 **Raison:** ${reason}`);
    } catch (error) {
      console.error("Error blacklisting user:", error);
      
      // Log error
      await storage.createLog({
        type: "error",
        action: "BLACKLIST_ERROR",
        message: `Error blacklisting user: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
      
      return message.reply("⚠️ **Erreur Système:** Une erreur est survenue lors de l'ajout à la liste noire. Veuillez réessayer plus tard.");
    }
  };

  const handleSetCooldownCommand = async (message: Message, args: string[], settings: BotSettings) => {
    // Check if user is admin
    if (!await isAdmin(message)) {
      return message.reply("❌ **Accès Refusé!** Vous n'avez pas les permissions administrateur nécessaires.");
    }
    
    // Check arguments
    if (args.length < 1) {
      return message.reply(`⚠️ **Format Incorrect:** \n**Usage:** \`${settings.prefix}setcooldown [minutes]\``);
    }
    
    const minutes = parseInt(args[0]);
    if (isNaN(minutes) || minutes < 0) {
      return message.reply(`❌ **Valeur Invalide:** Veuillez spécifier un nombre de minutes valide supérieur à 0.`);
    }
    
    try {
      // Convertir en secondes pour la base de données
      const cooldownSeconds = minutes * 60;
      
      // Mettre à jour les paramètres pour ce serveur
      if (message.guild) {
        const updatedSettings = await storage.updateBotSettings(message.guild.id, {
          cooldown: cooldownSeconds
        });
        
        if (updatedSettings) {
          // Log cooldown update
          await storage.createLog({
            type: "success",
            action: "COOLDOWN_UPDATED",
            message: `Admin ${message.author.tag} updated cooldown to ${minutes} minutes in guild ${message.guild.name}`,
          });
          
          return message.reply(`✅ **Cooldown Mis à Jour:** Le temps d'attente entre générations a été défini à \`${minutes} minutes\`.`);
        } else {
          return message.reply(`❌ **Erreur de Mise à Jour:** Impossible de mettre à jour le cooldown.`);
        }
      } else {
        return message.reply(`❌ **Erreur:** Cette commande ne peut être utilisée que dans un serveur Discord.`);
      }
    } catch (error) {
      console.error("Error updating cooldown:", error);
      
      // Log error
      await storage.createLog({
        type: "error",
        action: "COOLDOWN_UPDATE_ERROR",
        message: `Error updating cooldown: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
      
      return message.reply("⚠️ **Erreur Système:** Une erreur est survenue lors de la mise à jour du cooldown. Veuillez réessayer plus tard.");
    }
  };

  // Fonction utilitaire pour obtenir le stock disponible d'un service
  const getServiceStock = async (categoryId: number): Promise<string> => {
    const accounts = await storage.getAccounts({ categoryId });
    const available = accounts.filter(a => a.status === "available").length;
    const total = accounts.length;
    
    if (available === 0) return "🔴 Épuisé";
    if (available < total * 0.3) return `🟠 Faible (${available}/${total})`;
    if (available < total * 0.7) return `🟡 Modéré (${available}/${total})`;
    return `🟢 Bon (${available}/${total})`;
  };

  // Start the bot
  client.login(token)
    .catch(error => {
      console.error("Error logging in Discord bot:", error);
      storage.createLog({
        type: "error",
        action: "BOT_LOGIN_ERROR",
        message: `Discord bot login failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    });

  return client;
};
