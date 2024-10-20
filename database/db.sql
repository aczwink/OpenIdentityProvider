/*!999999\- enable the sandbox mode */ 
-- MariaDB dump 10.19  Distrib 10.11.8-MariaDB, for debian-linux-gnu (x86_64)
--
-- Host: localhost    Database: openidentityprovider
-- ------------------------------------------------------
-- Server version	10.11.8-MariaDB-0ubuntu0.24.04.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `appregistrations`
--

DROP TABLE IF EXISTS `appregistrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `appregistrations` (
  `internalId` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `externalId` varchar(200) NOT NULL,
  `displayName` varchar(200) NOT NULL,
  `secret` varchar(128) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `redirectURIs` varchar(200) NOT NULL,
  `scopes` text NOT NULL,
  PRIMARY KEY (`internalId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `appregistrations_claims`
--

DROP TABLE IF EXISTS `appregistrations_claims`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `appregistrations_claims` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `appregistrationId` int(10) unsigned NOT NULL,
  `claimName` varchar(100) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `claimType` varchar(10) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `appregistrations_claims_appregistrationId` FOREIGN KEY (`appregistrationId`) REFERENCES `appregistrations` (`internalId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `appregistrations_claims_values`
--

DROP TABLE IF EXISTS `appregistrations_claims_values`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `appregistrations_claims_values` (
  `claimId` int(10) unsigned NOT NULL,
  `value` varchar(200) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `groupId` int(10) unsigned NOT NULL,
  PRIMARY KEY (`claimId`,`value`),
  KEY `appregistrations_claims_values_groupId` (`groupId`),
  CONSTRAINT `appregistrations_claims_values_claimId` FOREIGN KEY (`claimId`) REFERENCES `appregistrations_claims` (`id`),
  CONSTRAINT `appregistrations_claims_values_groupId` FOREIGN KEY (`groupId`) REFERENCES `groups` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `groups`
--

DROP TABLE IF EXISTS `groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `groups` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(200) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `groups_members`
--

DROP TABLE IF EXISTS `groups_members`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `groups_members` (
  `groupId` int(10) unsigned NOT NULL,
  `userId` int(10) unsigned NOT NULL,
  PRIMARY KEY (`groupId`,`userId`),
  KEY `groups_members_userId` (`userId`),
  CONSTRAINT `groups_members_groupId` FOREIGN KEY (`groupId`) REFERENCES `groups` (`id`),
  CONSTRAINT `groups_members_userId` FOREIGN KEY (`userId`) REFERENCES `users` (`internalId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `internalId` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `externalId` varchar(200) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  PRIMARY KEY (`internalId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2024-10-20 22:27:47
