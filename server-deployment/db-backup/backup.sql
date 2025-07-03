-- MySQL dump 10.13  Distrib 8.0.42, for Linux (x86_64)
--
-- Host: 6irvb.h.filess.io    Database: carfindev_dancenight
-- ------------------------------------------------------
-- Server version	8.0.36-28

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `cars`
--

DROP TABLE IF EXISTS `cars`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cars` (
  `id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `organization_id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `vin` varchar(17) COLLATE utf8mb4_general_ci NOT NULL,
  `make` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `model` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `year` int NOT NULL,
  `color` varchar(30) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `mileage` int DEFAULT '0',
  `purchase_date` date NOT NULL,
  `purchase_price` decimal(10,2) NOT NULL,
  `sale_date` date DEFAULT NULL,
  `sale_price` decimal(10,2) DEFAULT NULL,
  `status` enum('in_stock','sold','pending') COLLATE utf8mb4_general_ci DEFAULT 'in_stock',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `vin` (`vin`),
  KEY `organization_id` (`organization_id`),
  CONSTRAINT `cars_ibfk_1` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cars`
--

LOCK TABLES `cars` WRITE;
/*!40000 ALTER TABLE `cars` DISABLE KEYS */;
INSERT INTO `cars` VALUES ('12fe0221-fd19-4fe5-9b14-b37926742470','36debc90-59df-4db4-af5d-78ef4c001ae2','TEST987654321EFGH','Honda','Civic',2021,'Red',67522,'2023-02-20',22000.00,'2025-05-15',25000.00,'sold','2025-05-28 11:56:07','2025-06-14 16:42:15'),('290fbc47-0fd9-4cb1-9a37-8b08f2c88669','36debc90-59df-4db4-af5d-78ef4c001ae2','JM1GJ1V51F1181005','MAZDA','Mazda6',2015,'White',0,'2025-06-27',11000.00,NULL,150000.00,'pending','2025-07-01 21:05:04','2025-07-01 21:08:38'),('2cc31065-0fb7-4609-8d08-51da64d5c4cc','36debc90-59df-4db4-af5d-78ef4c001ae2','A2345678912145678','Nissan','Altima',2020,'White',73201,'2025-05-13',31000.00,'2025-06-02',45000.00,'sold','2025-06-02 16:47:15','2025-06-14 16:42:15'),('6b2de218-ba50-4c64-ae13-d874915ab5dd','36debc90-59df-4db4-af5d-78ef4c001ae2','TEST555666777IJKL','Ford','Focus',2019,'White',153440,'2023-03-10',18000.00,'2024-01-20',20000.00,'sold','2025-05-28 11:56:07','2025-06-14 16:42:15'),('701922e2-fbe6-41b4-a7dd-3ee5fb0c360f','36debc90-59df-4db4-af5d-78ef4c001ae2','JN1CA21D8XT223244','NISSAN','Maxima',1999,'White',137596,'2025-06-13',5000.00,'2025-07-01',6000.00,'pending','2025-06-14 16:26:44','2025-07-01 21:59:49'),('9d1d3604-d2cf-4cd9-8b28-94ad6a72262b','36debc90-59df-4db4-af5d-78ef4c001ae2','JT2BG22KXY0423980','TOYOTA','Camry',2000,'White',0,'2025-06-26',12000.00,NULL,NULL,'pending','2025-06-28 22:06:51','2025-07-01 17:32:48'),('bcb8f8ee-0489-4509-a8d8-ac5404440090','36debc90-59df-4db4-af5d-78ef4c001ae2','12345678912345678','Nissan','Altima',2020,'White',17663,'2025-05-27',13000.00,NULL,NULL,'in_stock','2025-05-27 17:52:28','2025-06-14 16:42:15'),('c3306a8c-3bce-11f0-ab0b-6479f0559d3f','36debc90-59df-4db4-af5d-78ef4c001ae2','WBAFR7C50BC123456','BMW','3 Series',2020,NULL,65528,'2025-03-15',25000.00,'2025-04-20',28500.00,'sold','2025-05-28 14:19:27','2025-06-14 16:42:15'),('c339a74c-3bce-11f0-ab0b-6479f0559d3f','36debc90-59df-4db4-af5d-78ef4c001ae2','WBAFR7C50BC123457','BMW','X5',2019,NULL,64650,'2025-03-10',35000.00,'2025-04-25',39000.00,'sold','2025-05-28 14:19:27','2025-06-14 16:42:15'),('c339a9a1-3bce-11f0-ab0b-6479f0559d3f','36debc90-59df-4db4-af5d-78ef4c001ae2','WBAFR7C50BC123458','Mercedes','C-Class',2021,NULL,116668,'2025-03-20',30000.00,'2025-05-05',34000.00,'sold','2025-05-28 14:19:27','2025-06-14 16:42:15'),('c339e0be-3bce-11f0-ab0b-6479f0559d3f','36debc90-59df-4db4-af5d-78ef4c001ae2','WBAFR7C50BC123459','Mercedes','E-Class',2020,NULL,179389,'2025-03-25',40000.00,'2025-05-10',45000.00,'sold','2025-05-28 14:19:27','2025-06-14 16:42:15'),('c33a0d9e-3bce-11f0-ab0b-6479f0559d3f','36debc90-59df-4db4-af5d-78ef4c001ae2','WBAFR7C50BC123460','Audi','A4',2021,NULL,136942,'2025-04-01',28000.00,'2025-05-15',32000.00,'sold','2025-05-28 14:19:27','2025-06-14 16:42:15'),('ca4b012b-3bce-11f0-ab0b-6479f0559d3f','36debc90-59df-4db4-af5d-78ef4c001ae2','WBAFR7C50BC123461','Audi','Q5',2020,NULL,136544,'2025-04-05',38000.00,'2025-05-20',42000.00,'sold','2025-05-28 14:19:39','2025-06-14 16:42:15'),('ca4b3be8-3bce-11f0-ab0b-6479f0559d3f','36debc90-59df-4db4-af5d-78ef4c001ae2','WBAFR7C50BC123462','Toyota','Camry',2022,NULL,61896,'2025-04-10',22000.00,'2025-05-25',25000.00,'sold','2025-05-28 14:19:39','2025-06-14 16:42:15'),('ca4b615d-3bce-11f0-ab0b-6479f0559d3f','36debc90-59df-4db4-af5d-78ef4c001ae2','WBAFR7C50BC123463','Toyota','RAV4',2021,NULL,89845,'2025-04-15',26000.00,'2025-05-30',29000.00,'sold','2025-05-28 14:19:39','2025-06-14 16:42:15'),('ca4b8aba-3bce-11f0-ab0b-6479f0559d3f','36debc90-59df-4db4-af5d-78ef4c001ae2','WBAFR7C50BC123464','Honda','Accord',2022,NULL,53540,'2025-04-20',24000.00,'2025-06-01',27000.00,'sold','2025-05-28 14:19:39','2025-06-14 16:42:15'),('ca4cd307-3bce-11f0-ab0b-6479f0559d3f','36debc90-59df-4db4-af5d-78ef4c001ae2','WBAFR7C50BC123465','Honda','CR-V',2021,NULL,188164,'2025-04-25',27000.00,'2025-06-05',30000.00,'sold','2025-05-28 14:19:39','2025-06-14 16:42:15'),('f02e727f-3bce-11f0-ab0b-6479f0559d3f','36debc90-59df-4db4-af5d-78ef4c001ae2','WBAFR7C50BC123466','Ford','F-150',2020,NULL,76509,'2025-05-01',32000.00,'2025-06-10',36000.00,'sold','2025-05-28 14:20:42','2025-06-14 16:42:15'),('f02e99fc-3bce-11f0-ab0b-6479f0559d3f','36debc90-59df-4db4-af5d-78ef4c001ae2','WBAFR7C50BC123467','Ford','Escape',2021,NULL,61946,'2025-05-05',23000.00,'2025-06-15',26000.00,'sold','2025-05-28 14:20:42','2025-06-14 16:42:15'),('f02eacbb-3bce-11f0-ab0b-6479f0559d3f','36debc90-59df-4db4-af5d-78ef4c001ae2','WBAFR7C50BC123468','Chevrolet','Malibu',2022,NULL,70205,'2025-05-10',21000.00,'2025-06-20',24000.00,'sold','2025-05-28 14:20:42','2025-06-14 16:42:15'),('f02eb1f4-3bce-11f0-ab0b-6479f0559d3f','36debc90-59df-4db4-af5d-78ef4c001ae2','WBAFR7C50BC123469','Chevrolet','Equinox',2021,NULL,155187,'2025-05-15',25000.00,'2025-06-25',28000.00,'sold','2025-05-28 14:20:42','2025-06-14 16:42:15'),('f02eca5a-3bce-11f0-ab0b-6479f0559d3f','36debc90-59df-4db4-af5d-78ef4c001ae2','WBAFR7C50BC123470','Nissan','Altima',2022,NULL,155321,'2025-05-20',20000.00,'2025-06-30',23000.00,'sold','2025-05-28 14:20:42','2025-06-14 16:42:15'),('fd20314e-3bce-11f0-ab0b-6479f0559d3f','36debc90-59df-4db4-af5d-78ef4c001ae2','WBAFR7C50BC123471','Nissan','Altima',2021,'Black',101042,'2025-05-25',24000.00,'2025-07-01',27000.00,'sold','2025-05-28 14:21:04','2025-06-14 16:42:15'),('fd205280-3bce-11f0-ab0b-6479f0559d3f','36debc90-59df-4db4-af5d-78ef4c001ae2','WBAFR7C50BC123472','Hyundai','Elantra',2022,NULL,29248,'2025-05-30',18000.00,'2025-07-05',21000.00,'sold','2025-05-28 14:21:04','2025-06-14 16:42:15'),('fd209ab0-3bce-11f0-ab0b-6479f0559d3f','36debc90-59df-4db4-af5d-78ef4c001ae2','WBAFR7C50BC123475','Kia','Sorento',2020,'White',33117,'2025-06-10',28000.00,'2025-07-20',31000.00,'pending','2025-05-28 14:21:04','2025-06-14 16:42:15');
/*!40000 ALTER TABLE `cars` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `expense_attachments`
--

DROP TABLE IF EXISTS `expense_attachments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `expense_attachments` (
  `id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `expense_id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `file_name` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `file_size` int NOT NULL,
  `file_type` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `storage_url` varchar(500) COLLATE utf8mb4_general_ci NOT NULL,
  `storage_key` varchar(500) COLLATE utf8mb4_general_ci NOT NULL,
  `uploaded_by` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `uploaded_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_expense_id` (`expense_id`),
  KEY `idx_uploaded_by` (`uploaded_by`),
  CONSTRAINT `expense_attachments_ibfk_1` FOREIGN KEY (`expense_id`) REFERENCES `organization_expenses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `expense_attachments_ibfk_2` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `expense_attachments`
--

LOCK TABLES `expense_attachments` WRITE;
/*!40000 ALTER TABLE `expense_attachments` DISABLE KEYS */;
/*!40000 ALTER TABLE `expense_attachments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `license_tiers`
--

DROP TABLE IF EXISTS `license_tiers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `license_tiers` (
  `id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `tier_name` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `display_name` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `car_limit` int NOT NULL,
  `monthly_price` decimal(8,2) NOT NULL,
  `stripe_price_id` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `is_available_online` tinyint(1) DEFAULT '1',
  `sort_order` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `tier_name` (`tier_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `license_tiers`
--

LOCK TABLES `license_tiers` WRITE;
/*!40000 ALTER TABLE `license_tiers` DISABLE KEYS */;
INSERT INTO `license_tiers` VALUES ('40e52379-d16e-434c-b54a-d716a356a1bc','business','Business Plan',150,179.99,'price_1RbVmE4bsQpEhvmDDazrIF8x',1,3,1,'2025-06-28 00:31:45','2025-06-28 01:13:28'),('45550ad7-c429-4c8f-b9bf-46484be403c1','champion','Champion Plan',10000,0.00,NULL,0,0,1,'2025-06-28 00:31:45','2025-06-28 00:31:45'),('5cafe569-9450-40cf-a5a0-b354c4ba3023','enterprise','Enterprise Plan',10000,249.99,'price_1Reixo4bsQpEhvmDRdHfN8oM',1,4,1,'2025-06-28 00:31:45','2025-06-28 01:13:28'),('8ce5a926-3362-4de8-9cf4-90e72a36dcd9','starter','Starter Plan',30,79.99,'price_1RbVjX4bsQpEhvmDr2Oay1cp',1,1,1,'2025-06-28 00:31:45','2025-06-28 01:13:28'),('a8a9e389-d250-458a-a334-f70d48f704d1','professional','Professional Plan',75,119.99,'price_1RbVmE4bsQpEhvmD3L3HuwXI',1,2,1,'2025-06-28 00:31:45','2025-06-28 01:13:28');
/*!40000 ALTER TABLE `license_tiers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `maintenance_attachments`
--

DROP TABLE IF EXISTS `maintenance_attachments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `maintenance_attachments` (
  `id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `maintenance_id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `file_name` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `file_size` int NOT NULL,
  `file_type` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `storage_url` varchar(500) COLLATE utf8mb4_general_ci NOT NULL,
  `storage_key` varchar(500) COLLATE utf8mb4_general_ci NOT NULL,
  `uploaded_by` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `uploaded_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_maintenance_id` (`maintenance_id`),
  KEY `idx_uploaded_by` (`uploaded_by`),
  CONSTRAINT `maintenance_attachments_ibfk_1` FOREIGN KEY (`maintenance_id`) REFERENCES `maintenance_records` (`id`) ON DELETE CASCADE,
  CONSTRAINT `maintenance_attachments_ibfk_2` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `maintenance_attachments`
--

LOCK TABLES `maintenance_attachments` WRITE;
/*!40000 ALTER TABLE `maintenance_attachments` DISABLE KEYS */;
/*!40000 ALTER TABLE `maintenance_attachments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `maintenance_categories`
--

DROP TABLE IF EXISTS `maintenance_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `maintenance_categories` (
  `id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `name` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `organization_id` varchar(36) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `is_default` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `organization_id` (`organization_id`),
  CONSTRAINT `maintenance_categories_ibfk_1` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `maintenance_categories`
--

LOCK TABLES `maintenance_categories` WRITE;
/*!40000 ALTER TABLE `maintenance_categories` DISABLE KEYS */;
INSERT INTO `maintenance_categories` VALUES ('10389d23-be57-4ad9-801c-88566a025011','General Maintenance',NULL,1,'2025-05-27 17:13:00','2025-06-17 23:35:02'),('22020294-8bb6-43ca-b7fe-a06ac012ea42','Interior',NULL,1,'2025-05-27 17:13:00','2025-06-17 23:35:02'),('415f9500-cdd4-4596-a015-90f7f0ba7770','Transmission',NULL,1,'2025-05-27 17:13:00','2025-06-17 23:35:02'),('428f70fd-37be-4e4a-a998-d3c577835589','Tires',NULL,1,'2025-05-27 17:13:00','2025-06-17 23:35:02'),('66d5a74a-8583-47e4-86d6-6635cee717bf','Engine',NULL,1,'2025-05-27 17:13:00','2025-06-17 23:35:02'),('68b699b5-18d4-42a7-987a-d969bcce0a03','Body',NULL,1,'2025-05-27 17:13:00','2025-06-17 23:35:02'),('722162dc-700c-43a8-9962-61e17a58162d','Custom Engine Work 1','36debc90-59df-4db4-af5d-78ef4c001ae2',0,'2025-06-17 23:36:37','2025-06-17 23:45:14'),('7e755154-d85c-4993-beab-51d11d033fb9','Brakes',NULL,1,'2025-05-27 17:13:00','2025-06-17 23:35:02'),('85ea4c05-f95c-48bb-84bc-10e674419315','Test Category 2','36debc90-59df-4db4-af5d-78ef4c001ae2',0,'2025-06-17 23:45:25','2025-06-17 23:45:25'),('8e8ac303-493a-11f0-acc9-bcec23c373a5','Taxes',NULL,1,'2025-06-14 16:13:49','2025-06-17 23:35:02'),('8e8ac62c-493a-11f0-acc9-bcec23c373a5','Fees',NULL,1,'2025-06-14 16:13:49','2025-06-17 23:35:02'),('8e8ac69f-493a-11f0-acc9-bcec23c373a5','In State Tax',NULL,1,'2025-06-14 16:13:49','2025-06-17 23:35:02'),('8e8ac715-493a-11f0-acc9-bcec23c373a5','Out of State Tax',NULL,1,'2025-06-14 16:13:49','2025-06-17 23:35:02'),('987ece51-59eb-4458-a838-fa033fb67b17','Suspension',NULL,1,'2025-05-27 17:13:00','2025-06-17 23:35:02'),('c8df32ab-ef2b-48da-a089-17781d6c7b97','Electrical',NULL,1,'2025-05-27 17:13:00','2025-06-17 23:35:02'),('cae24cb3-094a-4ed4-baa0-2a198aa84c19','Other',NULL,1,'2025-05-27 17:13:00','2025-06-17 23:35:02'),('d19bfc90-3c11-11f0-ab0b-6479f0559d3f','Gas',NULL,1,'2025-05-28 22:19:27','2025-06-17 23:35:02'),('d19c30eb-3c11-11f0-ab0b-6479f0559d3f','Holding Cost',NULL,1,'2025-05-28 22:19:27','2025-06-17 23:35:02'),('d19c36dc-3c11-11f0-ab0b-6479f0559d3f','Towing',NULL,1,'2025-05-28 22:19:27','2025-06-17 23:35:02'),('d19c3bbe-3c11-11f0-ab0b-6479f0559d3f','Parking',NULL,1,'2025-05-28 22:19:27','2025-06-17 23:35:02'),('e2084313-7212-45cc-8e0f-d65db5ca8189','Test Category 3','36debc90-59df-4db4-af5d-78ef4c001ae2',0,'2025-06-17 23:57:57','2025-06-17 23:57:57'),('ecfe82a3-c143-4d23-b331-d55cd9e253cf','Oil Change',NULL,1,'2025-05-27 17:13:00','2025-06-17 23:35:02');
/*!40000 ALTER TABLE `maintenance_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `maintenance_records`
--

DROP TABLE IF EXISTS `maintenance_records`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `maintenance_records` (
  `id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `car_id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `category_id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `cost` decimal(10,2) NOT NULL,
  `maintenance_date` date NOT NULL,
  `vendor` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_general_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `car_id` (`car_id`),
  KEY `category_id` (`category_id`),
  CONSTRAINT `maintenance_records_ibfk_1` FOREIGN KEY (`car_id`) REFERENCES `cars` (`id`) ON DELETE CASCADE,
  CONSTRAINT `maintenance_records_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `maintenance_categories` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `maintenance_records`
--

LOCK TABLES `maintenance_records` WRITE;
/*!40000 ALTER TABLE `maintenance_records` DISABLE KEYS */;
INSERT INTO `maintenance_records` VALUES ('192007d5-3bcf-11f0-ab0b-6479f0559d3f','c3306a8c-3bce-11f0-ab0b-6479f0559d3f','ecfe82a3-c143-4d23-b331-d55cd9e253cf','Oil Change',45.99,'2025-03-20','Quick Lube','Regular maintenance','2025-05-28 14:21:51','2025-05-28 14:21:51'),('19200ba0-3bcf-11f0-ab0b-6479f0559d3f','c339a74c-3bce-11f0-ab0b-6479f0559d3f','7e755154-d85c-4993-beab-51d11d033fb9','Brake Pads Replacement',189.50,'2025-03-15','Auto Parts Plus','Front brake pads','2025-05-28 14:21:51','2025-05-28 14:21:51'),('19200c83-3bcf-11f0-ab0b-6479f0559d3f','c339a9a1-3bce-11f0-ab0b-6479f0559d3f','428f70fd-37be-4e4a-a998-d3c577835589','Tire Rotation',35.00,'2025-03-25','Tire Center','Routine tire rotation','2025-05-28 14:21:51','2025-05-28 14:21:51'),('192a5284-3bcf-11f0-ab0b-6479f0559d3f','c339e0be-3bce-11f0-ab0b-6479f0559d3f','ecfe82a3-c143-4d23-b331-d55cd9e253cf','Oil Change',52.99,'2025-04-01','Express Oil','Synthetic oil','2025-05-28 14:21:51','2025-05-28 14:21:51'),('192a53da-3bcf-11f0-ab0b-6479f0559d3f','c33a0d9e-3bce-11f0-ab0b-6479f0559d3f','10389d23-be57-4ad9-801c-88566a025011','Air Filter Replacement',25.99,'2025-04-10','Auto Zone','Engine air filter','2025-05-28 14:21:51','2025-05-28 14:21:51'),('2b6f1cac-3bcf-11f0-ab0b-6479f0559d3f','ca4b3be8-3bce-11f0-ab0b-6479f0559d3f','ecfe82a3-c143-4d23-b331-d55cd9e253cf','Oil Change',48.99,'2025-04-15','Valvoline Instant','Full synthetic','2025-05-28 14:22:22','2025-05-28 14:22:22'),('2b6f21fd-3bcf-11f0-ab0b-6479f0559d3f','ca4b615d-3bce-11f0-ab0b-6479f0559d3f','987ece51-59eb-4458-a838-fa033fb67b17','Shock Absorber Check',75.00,'2025-04-20','Suspension Pro','Inspection only','2025-05-28 14:22:22','2025-05-28 14:22:22'),('2b6f234f-3bcf-11f0-ab0b-6479f0559d3f','ca4b8aba-3bce-11f0-ab0b-6479f0559d3f','428f70fd-37be-4e4a-a998-d3c577835589','Tire Balancing',60.00,'2025-04-25','Discount Tire','All four tires','2025-05-28 14:22:22','2025-05-28 14:22:22'),('2b78848d-3bcf-11f0-ab0b-6479f0559d3f','ca4cd307-3bce-11f0-ab0b-6479f0559d3f','ecfe82a3-c143-4d23-b331-d55cd9e253cf','Oil Change',55.99,'2025-05-01','Jiffy Lube','High mileage oil','2025-05-28 14:22:22','2025-05-28 14:22:22'),('2b788780-3bcf-11f0-ab0b-6479f0559d3f','f02e727f-3bce-11f0-ab0b-6479f0559d3f','66d5a74a-8583-47e4-86d6-6635cee717bf','Spark Plug Replacement',125.00,'2025-05-05','Engine Works','All 8 plugs','2025-05-28 14:22:22','2025-05-28 14:22:22'),('33fbbc27-3bcf-11f0-ab0b-6479f0559d3f','f02e99fc-3bce-11f0-ab0b-6479f0559d3f','7e755154-d85c-4993-beab-51d11d033fb9','Brake Fluid Change',89.99,'2025-05-10','Brake Masters','DOT 4 fluid','2025-05-28 14:22:36','2025-05-28 14:22:36'),('33fbc0a3-3bcf-11f0-ab0b-6479f0559d3f','f02eacbb-3bce-11f0-ab0b-6479f0559d3f','ecfe82a3-c143-4d23-b331-d55cd9e253cf','Oil Change',42.99,'2025-05-15','Quick Change','Conventional oil','2025-05-28 14:22:36','2025-05-28 14:22:36'),('33fbc1a4-3bcf-11f0-ab0b-6479f0559d3f','f02eb1f4-3bce-11f0-ab0b-6479f0559d3f','22020294-8bb6-43ca-b7fe-a06ac012ea42','Cabin Air Filter',29.99,'2025-05-20','Filter Pro','HEPA filter','2025-05-28 14:22:36','2025-05-28 14:22:36'),('33fbc23c-3bcf-11f0-ab0b-6479f0559d3f','f02eca5a-3bce-11f0-ab0b-6479f0559d3f','428f70fd-37be-4e4a-a998-d3c577835589','Tire Pressure Check',15.00,'2025-05-25','Gas Station Pro','All tires adjusted','2025-05-28 14:22:36','2025-05-28 14:22:36'),('33fbc2d0-3bcf-11f0-ab0b-6479f0559d3f','fd20314e-3bce-11f0-ab0b-6479f0559d3f','c8df32ab-ef2b-48da-a089-17781d6c7b97','Battery Test',25.00,'2025-05-30','Battery Plus','Load test passed','2025-05-28 14:22:36','2025-05-28 14:22:36'),('417d8e68-4b0d-4207-a1b6-683c32824702','bcb8f8ee-0489-4509-a8d8-ac5404440090','c8df32ab-ef2b-48da-a089-17781d6c7b97','New headlights',1200.00,'2025-05-28','In Home','New headlights installed','2025-05-28 11:05:12','2025-05-28 11:05:12'),('5b31a924-3bcf-11f0-ab0b-6479f0559d3f','fd205280-3bce-11f0-ab0b-6479f0559d3f','ecfe82a3-c143-4d23-b331-d55cd9e253cf','Oil Change',39.99,'2025-06-01','Economy Lube','Basic oil change','2025-05-28 14:23:42','2025-05-28 14:23:42'),('5b31ae76-3bcf-11f0-ab0b-6479f0559d3f','fd209ab0-3bce-11f0-ab0b-6479f0559d3f','7e755154-d85c-4993-beab-51d11d033fb9','Brake Inspection',50.00,'2025-06-15','Safety First','Annual inspection','2025-05-28 14:23:42','2025-06-15 21:37:48'),('60f71c00-9aa3-46d8-97f0-479423d849c8','2cc31065-0fb7-4609-8d08-51da64d5c4cc','722162dc-700c-43a8-9962-61e17a58162d','tire',600.00,'2025-07-01','Michigan',NULL,'2025-07-01 18:05:56','2025-07-01 18:05:56'),('811fba57-1f72-4c66-a1ff-2f66a2d8b450','2cc31065-0fb7-4609-8d08-51da64d5c4cc','ecfe82a3-c143-4d23-b331-d55cd9e253cf','Oil change',110.00,'2025-06-14','In home','test','2025-06-14 16:07:00','2025-06-14 16:07:00'),('9278ec4d-e4f6-47b1-851f-3dca18a704ae','6b2de218-ba50-4c64-ae13-d874915ab5dd','68b699b5-18d4-42a7-987a-d969bcce0a03','Front bumper',500.00,'2025-05-28','In home','replaced front bumper','2025-05-28 12:12:11','2025-05-28 12:12:11'),('a51d7616-c932-4231-a0e3-162730450f04','fd209ab0-3bce-11f0-ab0b-6479f0559d3f','cae24cb3-094a-4ed4-baa0-2a198aa84c19','Gas',50.00,'2025-05-28','Gas','Gas','2025-05-28 22:15:42','2025-05-28 22:15:42'),('a7f75c62-3f92-401c-86ed-381fa77d0659','701922e2-fbe6-41b4-a7dd-3ee5fb0c360f','ecfe82a3-c143-4d23-b331-d55cd9e253cf','Oil change',50.00,'2025-07-01','Valvoline',NULL,'2025-07-01 22:39:02','2025-07-01 22:39:02'),('b1df37f5-f5ec-4a0c-a26f-e181f4cb2d1b','12fe0221-fd19-4fe5-9b14-b37926742470','10389d23-be57-4ad9-801c-88566a025011','Oil change',65.00,'2023-05-20','Quick Lube',NULL,'2025-05-28 11:56:07','2025-05-28 11:56:07'),('b53a216d-3684-4e54-810d-b73f76ab55ab','2cc31065-0fb7-4609-8d08-51da64d5c4cc','68b699b5-18d4-42a7-987a-d969bcce0a03','Replaced back bumper',1500.00,'2025-06-02','In home','It had a dent','2025-06-02 16:48:47','2025-06-14 16:07:15'),('c538a018-9e92-4e49-93c7-b7a30d99dccb','fd20314e-3bce-11f0-ab0b-6479f0559d3f','cae24cb3-094a-4ed4-baa0-2a198aa84c19','Gas',35.00,'2025-05-28','Gas','Gas','2025-05-28 22:07:24','2025-05-28 22:07:24'),('c637f4d9-4b95-4133-8b69-225830eda5d3','fd205280-3bce-11f0-ab0b-6479f0559d3f','722162dc-700c-43a8-9962-61e17a58162d','Test custom work',120.00,'2025-06-18','In Home','Testing new custom category','2025-06-18 00:02:24','2025-06-18 00:02:24'),('e46298c7-3ab9-4292-bd9e-4b06b5faf125','9d1d3604-d2cf-4cd9-8b28-94ad6a72262b','68b699b5-18d4-42a7-987a-d969bcce0a03','Front bumper',500.00,'2025-06-27','In Home','Test','2025-06-28 22:07:38','2025-07-01 03:37:05'),('f8e3ded9-6a35-4561-97ac-7c955f79302b','9d1d3604-d2cf-4cd9-8b28-94ad6a72262b','66d5a74a-8583-47e4-86d6-6635cee717bf','New Engine replacement ',5000.00,'2025-07-01','Michigan',NULL,'2025-07-01 17:35:19','2025-07-01 17:35:19');
/*!40000 ALTER TABLE `maintenance_records` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `organization_expense_categories`
--

DROP TABLE IF EXISTS `organization_expense_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `organization_expense_categories` (
  `id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `organization_id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `category_name` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `is_recurring` tinyint(1) DEFAULT '0',
  `created_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `organization_id` (`organization_id`),
  CONSTRAINT `organization_expense_categories_ibfk_1` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `organization_expense_categories`
--

LOCK TABLES `organization_expense_categories` WRITE;
/*!40000 ALTER TABLE `organization_expense_categories` DISABLE KEYS */;
INSERT INTO `organization_expense_categories` VALUES ('2d9f6eb4-2936-4618-a2b3-93fefb8d6838','36debc90-59df-4db4-af5d-78ef4c001ae2','Utilities',1,'2025-06-16 22:48:52'),('71b5be56-d683-4df0-8efe-65fe250f6134','36debc90-59df-4db4-af5d-78ef4c001ae2','Phone',0,'2025-06-18 02:10:11'),('886fcbc9-f9e3-4d34-b61e-c64f141a6d09','36debc90-59df-4db4-af5d-78ef4c001ae2','Office Rent',1,'2025-06-16 22:48:44'),('946db259-a55f-454d-9a72-64e6897a1fcf','36debc90-59df-4db4-af5d-78ef4c001ae2','Marketing',1,'2025-06-17 01:58:21'),('ba752ef1-f356-4125-a19c-62243499881f','36debc90-59df-4db4-af5d-78ef4c001ae2','Internet',1,'2025-06-17 02:39:27');
/*!40000 ALTER TABLE `organization_expense_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `organization_expenses`
--

DROP TABLE IF EXISTS `organization_expenses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `organization_expenses` (
  `id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `organization_id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `category_id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `description` text COLLATE utf8mb4_general_ci,
  `expense_date` date NOT NULL,
  `is_recurring` tinyint(1) DEFAULT '0',
  `recurring_frequency` enum('monthly','quarterly','annually') COLLATE utf8mb4_general_ci DEFAULT NULL,
  `created_by_user_id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `organization_id` (`organization_id`),
  KEY `category_id` (`category_id`),
  KEY `created_by_user_id` (`created_by_user_id`),
  CONSTRAINT `organization_expenses_ibfk_1` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `organization_expenses_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `organization_expense_categories` (`id`),
  CONSTRAINT `organization_expenses_ibfk_3` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `organization_expenses`
--

LOCK TABLES `organization_expenses` WRITE;
/*!40000 ALTER TABLE `organization_expenses` DISABLE KEYS */;
INSERT INTO `organization_expenses` VALUES ('2da258aa-c537-4e18-8c11-45979bc12622','36debc90-59df-4db4-af5d-78ef4c001ae2','ba752ef1-f356-4125-a19c-62243499881f',50.00,'internet','2025-06-17',0,NULL,'b39334f8-e129-4949-8fd6-eb628bffdbd5','2025-06-17 04:51:45','2025-06-17 04:51:45'),('39f58cc6-47d2-468e-9411-63b3a8ebc340','36debc90-59df-4db4-af5d-78ef4c001ae2','ba752ef1-f356-4125-a19c-62243499881f',40.00,'phone 2','2025-06-16',0,NULL,'b39334f8-e129-4949-8fd6-eb628bffdbd5','2025-06-17 04:54:31','2025-07-01 03:37:21'),('6d6d5302-8bfe-4346-a9d7-83853ea82f33','36debc90-59df-4db4-af5d-78ef4c001ae2','946db259-a55f-454d-9a72-64e6897a1fcf',30.00,'test 1','2025-06-17',0,NULL,'b39334f8-e129-4949-8fd6-eb628bffdbd5','2025-06-17 04:54:03','2025-06-17 04:54:03'),('7580bc96-2437-4a25-ac28-f34d5d955325','36debc90-59df-4db4-af5d-78ef4c001ae2','ba752ef1-f356-4125-a19c-62243499881f',50.00,'','2025-07-01',0,NULL,'b39334f8-e129-4949-8fd6-eb628bffdbd5','2025-07-01 22:42:25','2025-07-01 22:42:25'),('8f0da733-11ba-4c83-b4e4-cbdf7f2699ba','36debc90-59df-4db4-af5d-78ef4c001ae2','2d9f6eb4-2936-4618-a2b3-93fefb8d6838',20.00,'test','2025-06-16',0,NULL,'b39334f8-e129-4949-8fd6-eb628bffdbd5','2025-06-17 04:53:47','2025-07-01 03:37:30'),('98f359ec-8ed8-49fc-8187-2c4f1bd026b7','36debc90-59df-4db4-af5d-78ef4c001ae2','886fcbc9-f9e3-4d34-b61e-c64f141a6d09',1000.00,'Rent','2025-06-28',0,NULL,'b39334f8-e129-4949-8fd6-eb628bffdbd5','2025-06-28 22:09:02','2025-06-28 22:09:02'),('cfebf4c7-9594-40a6-b700-89355fd4b14d','36debc90-59df-4db4-af5d-78ef4c001ae2','886fcbc9-f9e3-4d34-b61e-c64f141a6d09',1500.00,'','2025-07-01',0,NULL,'b39334f8-e129-4949-8fd6-eb628bffdbd5','2025-07-01 22:42:57','2025-07-01 22:42:57'),('f6c4e2c7-74de-4f5e-914a-0767a172a1ac','36debc90-59df-4db4-af5d-78ef4c001ae2','886fcbc9-f9e3-4d34-b61e-c64f141a6d09',2500.00,'Monthly office rent payment','2025-06-16',1,'monthly','b39334f8-e129-4949-8fd6-eb628bffdbd5','2025-06-16 22:49:17','2025-06-16 22:49:17');
/*!40000 ALTER TABLE `organization_expenses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `organization_licenses`
--

DROP TABLE IF EXISTS `organization_licenses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `organization_licenses` (
  `id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `organization_id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `license_type` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `car_limit` int NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `is_free_account` tinyint(1) DEFAULT '0',
  `free_reason` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `stripe_customer_id` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `stripe_subscription_id` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `subscription_status` enum('active','past_due','canceled','incomplete','trialing','unpaid') COLLATE utf8mb4_general_ci DEFAULT NULL,
  `current_period_start` timestamp NULL DEFAULT NULL,
  `current_period_end` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_org_license` (`organization_id`),
  KEY `license_type` (`license_type`),
  CONSTRAINT `organization_licenses_ibfk_1` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `organization_licenses_ibfk_2` FOREIGN KEY (`license_type`) REFERENCES `license_tiers` (`tier_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `organization_licenses`
--

LOCK TABLES `organization_licenses` WRITE;
/*!40000 ALTER TABLE `organization_licenses` DISABLE KEYS */;
INSERT INTO `organization_licenses` VALUES ('94bcd4d1-d9ea-43dd-91a6-fe73ce325427','36debc90-59df-4db4-af5d-78ef4c001ae2','champion',10000,1,1,'admin_organization',NULL,NULL,NULL,NULL,NULL,'2025-06-28 00:31:45','2025-06-28 00:31:45'),('a9cf1232-0d6a-4460-aa6a-22f074ddf1b2','3f0a0b11-3ae6-4a88-b16d-317023fddb83','starter',30,1,0,NULL,'cus_Sb90UGuRZfKMx7','sub_1RfwiS4bsQpEhvmDHWXPlAfv','active',NULL,NULL,'2025-07-01 05:26:53','2025-07-01 05:26:53');
/*!40000 ALTER TABLE `organization_licenses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `organizations`
--

DROP TABLE IF EXISTS `organizations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `organizations` (
  `id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `address` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `phone` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `email` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `organizations`
--

LOCK TABLES `organizations` WRITE;
/*!40000 ALTER TABLE `organizations` DISABLE KEYS */;
INSERT INTO `organizations` VALUES ('36debc90-59df-4db4-af5d-78ef4c001ae2','Admin Organization',NULL,NULL,'admin@carfin.com','2025-05-27 17:13:00','2025-05-27 17:13:00'),('3f0a0b11-3ae6-4a88-b16d-317023fddb83','devtest',NULL,NULL,'a.jonline@yahoo.com','2025-07-01 05:26:53','2025-07-01 05:26:53');
/*!40000 ALTER TABLE `organizations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stripe_events`
--

DROP TABLE IF EXISTS `stripe_events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stripe_events` (
  `id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `stripe_event_id` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `event_type` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `organization_id` varchar(36) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `license_id` varchar(36) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `processed_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `event_data` json DEFAULT NULL,
  `processing_status` enum('pending','processed','failed') COLLATE utf8mb4_general_ci DEFAULT 'processed',
  `error_message` text COLLATE utf8mb4_general_ci,
  PRIMARY KEY (`id`),
  UNIQUE KEY `stripe_event_id` (`stripe_event_id`),
  KEY `organization_id` (`organization_id`),
  KEY `license_id` (`license_id`),
  CONSTRAINT `stripe_events_ibfk_1` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`),
  CONSTRAINT `stripe_events_ibfk_2` FOREIGN KEY (`license_id`) REFERENCES `organization_licenses` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stripe_events`
--

LOCK TABLES `stripe_events` WRITE;
/*!40000 ALTER TABLE `stripe_events` DISABLE KEYS */;
INSERT INTO `stripe_events` VALUES ('447f15d1-9d21-4de1-afad-955b77e4fb45','evt_1RfwiT4bsQpEhvmDv2iuROxa','checkout.session.completed',NULL,NULL,'2025-07-01 05:26:51','{\"id\": \"evt_1RfwiT4bsQpEhvmDv2iuROxa\", \"data\": {\"object\": {\"id\": \"cs_test_b1VACwGzRmu9thE1PdvZiHbSjGFtzdGCLNTYmg8qTVsL30R6PkdJd5HJ0A\", \"url\": null, \"mode\": \"subscription\", \"locale\": null, \"object\": \"checkout.session\", \"status\": \"complete\", \"consent\": null, \"created\": 1751347522, \"invoice\": \"in_1RfwiT4bsQpEhvmDz2HgqWFw\", \"ui_mode\": \"hosted\", \"currency\": \"usd\", \"customer\": \"cus_Sb90UGuRZfKMx7\", \"livemode\": false, \"metadata\": {\"owner_email\": \"a.jonline@yahoo.com\", \"organization_name\": \"devtest\"}, \"discounts\": [], \"cancel_url\": \"http://localhost:8080/cancel.html\", \"expires_at\": 1751433922, \"custom_text\": {\"submit\": null, \"after_submit\": null, \"shipping_address\": null, \"terms_of_service_acceptance\": null}, \"permissions\": null, \"submit_type\": null, \"success_url\": \"http://localhost:8080/success.html\", \"amount_total\": 7999, \"payment_link\": null, \"setup_intent\": null, \"subscription\": \"sub_1RfwiS4bsQpEhvmDHWXPlAfv\", \"automatic_tax\": {\"status\": null, \"enabled\": false, \"provider\": null, \"liability\": null}, \"client_secret\": null, \"custom_fields\": [], \"shipping_cost\": null, \"total_details\": {\"amount_tax\": 0, \"amount_discount\": 0, \"amount_shipping\": 0}, \"customer_email\": \"a.jonline@yahoo.com\", \"payment_intent\": null, \"payment_status\": \"paid\", \"recovered_from\": null, \"wallet_options\": null, \"amount_subtotal\": 7999, \"adaptive_pricing\": null, \"after_expiration\": null, \"customer_details\": {\"name\": \"Ahmed alzubidy\", \"email\": \"a.jonline@yahoo.com\", \"phone\": null, \"address\": {\"city\": \"Seattle\", \"line1\": \"1808 Bellevue Avenue\", \"line2\": null, \"state\": \"WA\", \"country\": \"US\", \"postal_code\": \"98122\"}, \"tax_ids\": [], \"tax_exempt\": \"none\"}, \"invoice_creation\": null, \"shipping_options\": [], \"customer_creation\": \"always\", \"consent_collection\": null, \"client_reference_id\": null, \"currency_conversion\": null, \"payment_method_types\": [\"card\"], \"allow_promotion_codes\": true, \"collected_information\": {\"shipping_details\": null}, \"payment_method_options\": {\"card\": {\"request_three_d_secure\": \"automatic\"}}, \"phone_number_collection\": {\"enabled\": false}, \"payment_method_collection\": \"always\", \"billing_address_collection\": \"required\", \"shipping_address_collection\": null, \"saved_payment_method_options\": {\"payment_method_save\": null, \"payment_method_remove\": \"disabled\", \"allow_redisplay_filters\": [\"always\"]}, \"payment_method_configuration_details\": null}}, \"type\": \"checkout.session.completed\", \"object\": \"event\", \"created\": 1751347609, \"request\": {\"id\": null, \"idempotency_key\": null}, \"livemode\": false, \"api_version\": \"2025-05-28.basil\", \"pending_webhooks\": 1}','processed',NULL),('448d95a0-aee6-4c71-997c-de56aead9657','evt_test_dev_stripe_1751084029177','customer.subscription.created',NULL,NULL,'2025-06-28 04:13:49','{\"id\": \"evt_test_dev_stripe_1751084029177\", \"data\": {\"object\": {\"id\": \"sub_test_dev_stripe_1751084029177\", \"items\": {\"data\": [{\"price\": {\"id\": \"price_1RbVjX4bsQpEhvmDr2Oay1cp\"}}]}, \"object\": \"subscription\", \"status\": \"active\", \"customer\": \"cus_test_dev_stripe\", \"metadata\": {\"owner_email\": \"a.jonline@yahoo.com\", \"organization_name\": \"Dev Stripe\"}, \"current_period_end\": 1753676029, \"current_period_start\": 1751084029}}, \"type\": \"customer.subscription.created\", \"object\": \"event\", \"created\": 1751084029, \"api_version\": \"2020-08-27\"}','processed',NULL),('50022338-a213-4bbe-a08c-d7750b0240ce','evt_1RfwiU4bsQpEhvmDgSSVAy88','invoice.payment_succeeded',NULL,NULL,'2025-07-01 05:26:51','{\"id\": \"evt_1RfwiU4bsQpEhvmDgSSVAy88\", \"data\": {\"object\": {\"id\": \"in_1RfwiT4bsQpEhvmDz2HgqWFw\", \"lines\": {\"url\": \"/v1/invoices/in_1RfwiT4bsQpEhvmDz2HgqWFw/lines\", \"data\": [{\"id\": \"il_1RfwiR4bsQpEhvmDIus2qGjf\", \"taxes\": [], \"amount\": 7999, \"object\": \"line_item\", \"parent\": {\"type\": \"subscription_item_details\", \"invoice_item_details\": null, \"subscription_item_details\": {\"proration\": false, \"invoice_item\": null, \"subscription\": \"sub_1RfwiS4bsQpEhvmDHWXPlAfv\", \"proration_details\": {\"credited_items\": null}, \"subscription_item\": \"si_Sb90QXAbyGd22Y\"}}, \"period\": {\"end\": 1754026007, \"start\": 1751347607}, \"invoice\": \"in_1RfwiT4bsQpEhvmDz2HgqWFw\", \"pricing\": {\"type\": \"price_details\", \"price_details\": {\"price\": \"price_1RbVjX4bsQpEhvmDr2Oay1cp\", \"product\": \"prod_SWYraUKXbsE80F\"}, \"unit_amount_decimal\": \"7999\"}, \"currency\": \"usd\", \"livemode\": false, \"metadata\": {}, \"quantity\": 1, \"discounts\": [], \"description\": \"1 × CarLedgr (at $79.99 / month)\", \"discountable\": true, \"discount_amounts\": [], \"pretax_credit_amounts\": []}], \"object\": \"list\", \"has_more\": false, \"total_count\": 1}, \"total\": 7999, \"footer\": null, \"issuer\": {\"type\": \"self\"}, \"number\": \"D0KNFMZG-0001\", \"object\": \"invoice\", \"parent\": {\"type\": \"subscription_details\", \"quote_details\": null, \"subscription_details\": {\"metadata\": {}, \"subscription\": \"sub_1RfwiS4bsQpEhvmDHWXPlAfv\"}}, \"status\": \"paid\", \"created\": 1751347607, \"currency\": \"usd\", \"customer\": \"cus_Sb90UGuRZfKMx7\", \"due_date\": null, \"livemode\": false, \"metadata\": {}, \"subtotal\": 7999, \"attempted\": true, \"discounts\": [], \"rendering\": null, \"amount_due\": 7999, \"period_end\": 1751347607, \"test_clock\": null, \"amount_paid\": 7999, \"application\": null, \"description\": null, \"invoice_pdf\": \"https://pay.stripe.com/invoice/acct_1RbVHx4bsQpEhvmD/test_YWNjdF8xUmJWSHg0YnNRcEVodm1ELF9TYjkwVTh5UzdDc1BGeTdONkZVYWZ3UXZyTFJNZ1ljLDE0MTg4ODQxMA0200GTgJ6Oy9/pdf?s=ap\", \"total_taxes\": [], \"account_name\": \"New business sandbox\", \"auto_advance\": false, \"effective_at\": 1751347607, \"from_invoice\": null, \"on_behalf_of\": null, \"period_start\": 1751347607, \"attempt_count\": 0, \"automatic_tax\": {\"status\": null, \"enabled\": false, \"provider\": null, \"liability\": null, \"disabled_reason\": null}, \"custom_fields\": null, \"customer_name\": \"Ahmed alzubidy\", \"shipping_cost\": null, \"billing_reason\": \"subscription_create\", \"customer_email\": \"a.jonline@yahoo.com\", \"customer_phone\": null, \"default_source\": null, \"ending_balance\": 0, \"receipt_number\": null, \"account_country\": \"US\", \"account_tax_ids\": null, \"amount_overpaid\": 0, \"amount_shipping\": 0, \"latest_revision\": null, \"amount_remaining\": 0, \"customer_address\": {\"city\": \"Seattle\", \"line1\": \"1808 Bellevue Avenue\", \"line2\": null, \"state\": \"WA\", \"country\": \"US\", \"postal_code\": \"98122\"}, \"customer_tax_ids\": [], \"payment_settings\": {\"default_mandate\": null, \"payment_method_types\": [\"card\"], \"payment_method_options\": {\"card\": {\"request_three_d_secure\": \"automatic\"}, \"konbini\": null, \"acss_debit\": null, \"bancontact\": null, \"sepa_debit\": null, \"us_bank_account\": null, \"customer_balance\": null}}, \"shipping_details\": null, \"starting_balance\": 0, \"collection_method\": \"charge_automatically\", \"customer_shipping\": null, \"default_tax_rates\": [], \"hosted_invoice_url\": \"https://invoice.stripe.com/i/acct_1RbVHx4bsQpEhvmD/test_YWNjdF8xUmJWSHg0YnNRcEVodm1ELF9TYjkwVTh5UzdDc1BGeTdONkZVYWZ3UXZyTFJNZ1ljLDE0MTg4ODQxMA0200GTgJ6Oy9?s=ap\", \"status_transitions\": {\"paid_at\": 1751347607, \"voided_at\": null, \"finalized_at\": 1751347607, \"marked_uncollectible_at\": null}, \"customer_tax_exempt\": \"none\", \"total_excluding_tax\": 7999, \"next_payment_attempt\": null, \"statement_descriptor\": null, \"webhooks_delivered_at\": 1751347607, \"default_payment_method\": null, \"subtotal_excluding_tax\": 7999, \"total_discount_amounts\": [], \"last_finalization_error\": null, \"automatically_finalizes_at\": null, \"total_pretax_credit_amounts\": [], \"pre_payment_credit_notes_amount\": 0, \"post_payment_credit_notes_amount\": 0}}, \"type\": \"invoice.payment_succeeded\", \"object\": \"event\", \"created\": 1751347609, \"request\": {\"id\": null, \"idempotency_key\": \"182b6f93-3bb8-498b-b767-eb773f3a46a8\"}, \"livemode\": false, \"api_version\": \"2025-05-28.basil\", \"pending_webhooks\": 1}','processed',NULL),('566bcd8a-8f08-4d2a-bdec-0fd91afa8924','evt_test_dev_stripe_1751084476762','customer.subscription.created',NULL,NULL,'2025-06-28 04:21:16','{\"id\": \"evt_test_dev_stripe_1751084476762\", \"data\": {\"object\": {\"id\": \"sub_test_dev_stripe_1751084476762\", \"items\": {\"data\": [{\"price\": {\"id\": \"price_1RbVjX4bsQpEhvmDr2Oay1cp\"}}]}, \"object\": \"subscription\", \"status\": \"active\", \"customer\": \"cus_test_dev_stripe\", \"metadata\": {\"owner_email\": \"a.jonline@yahoo.com\", \"organization_name\": \"Dev Stripe\"}, \"current_period_end\": 1753676476, \"current_period_start\": 1751084476}}, \"type\": \"customer.subscription.created\", \"object\": \"event\", \"created\": 1751084476, \"api_version\": \"2020-08-27\"}','processed',NULL),('640ccb25-db6b-417a-b0c2-f88c034078a9','evt_1Repzq4bsQpEhvmDb8A3iqor','invoice.payment_succeeded',NULL,NULL,'2025-06-28 04:04:10','{\"id\": \"evt_1Repzq4bsQpEhvmDb8A3iqor\", \"data\": {\"object\": {\"id\": \"in_1Repzn4bsQpEhvmD8IQuhapD\", \"lines\": {\"url\": \"/v1/invoices/in_1Repzn4bsQpEhvmD8IQuhapD/lines\", \"data\": [{\"id\": \"il_1Repzn4bsQpEhvmD9kJUMPcL\", \"taxes\": [], \"amount\": 1500, \"object\": \"line_item\", \"parent\": {\"type\": \"subscription_item_details\", \"invoice_item_details\": null, \"subscription_item_details\": {\"proration\": false, \"invoice_item\": null, \"subscription\": \"sub_1Repzn4bsQpEhvmDsy2AcXt3\", \"proration_details\": {\"credited_items\": null}, \"subscription_item\": \"si_SZzzkCJ1ZW6pfs\"}}, \"period\": {\"end\": 1753675447, \"start\": 1751083447}, \"invoice\": \"in_1Repzn4bsQpEhvmD8IQuhapD\", \"pricing\": {\"type\": \"price_details\", \"price_details\": {\"price\": \"price_1Repzm4bsQpEhvmDpn8OqGmE\", \"product\": \"prod_SZzzobHGwDARCn\"}, \"unit_amount_decimal\": \"1500\"}, \"currency\": \"usd\", \"livemode\": false, \"metadata\": {}, \"quantity\": 1, \"discounts\": [], \"description\": \"1 × myproduct (at $15.00 / month)\", \"discountable\": true, \"discount_amounts\": [], \"pretax_credit_amounts\": []}], \"object\": \"list\", \"has_more\": false, \"total_count\": 1}, \"total\": 1500, \"footer\": null, \"issuer\": {\"type\": \"self\"}, \"number\": \"NYZ3JZEL-0001\", \"object\": \"invoice\", \"parent\": {\"type\": \"subscription_details\", \"quote_details\": null, \"subscription_details\": {\"metadata\": {}, \"subscription\": \"sub_1Repzn4bsQpEhvmDsy2AcXt3\"}}, \"status\": \"paid\", \"created\": 1751083447, \"currency\": \"usd\", \"customer\": \"cus_SZzz5r9mMsh6fp\", \"due_date\": null, \"livemode\": false, \"metadata\": {}, \"subtotal\": 1500, \"attempted\": true, \"discounts\": [], \"rendering\": null, \"amount_due\": 1500, \"period_end\": 1751083447, \"test_clock\": null, \"amount_paid\": 1500, \"application\": null, \"description\": null, \"invoice_pdf\": \"https://pay.stripe.com/invoice/acct_1RbVHx4bsQpEhvmD/test_YWNjdF8xUmJWSHg0YnNRcEVodm1ELF9TWnp6NEVhWVNNT1JHUUljcEJoVEFMekNLQjhFc3ZvLDE0MTYyNDI1MA0200fIcw4AWq/pdf?s=ap\", \"total_taxes\": [], \"account_name\": \"New business sandbox\", \"auto_advance\": false, \"effective_at\": 1751083447, \"from_invoice\": null, \"on_behalf_of\": null, \"period_start\": 1751083447, \"attempt_count\": 1, \"automatic_tax\": {\"status\": null, \"enabled\": false, \"provider\": null, \"liability\": null, \"disabled_reason\": null}, \"custom_fields\": null, \"customer_name\": null, \"shipping_cost\": null, \"billing_reason\": \"subscription_create\", \"customer_email\": null, \"customer_phone\": null, \"default_source\": null, \"ending_balance\": 0, \"receipt_number\": null, \"account_country\": \"US\", \"account_tax_ids\": null, \"amount_overpaid\": 0, \"amount_shipping\": 0, \"latest_revision\": null, \"amount_remaining\": 0, \"customer_address\": null, \"customer_tax_ids\": [], \"payment_settings\": {\"default_mandate\": null, \"payment_method_types\": null, \"payment_method_options\": null}, \"shipping_details\": null, \"starting_balance\": 0, \"collection_method\": \"charge_automatically\", \"customer_shipping\": null, \"default_tax_rates\": [], \"hosted_invoice_url\": \"https://invoice.stripe.com/i/acct_1RbVHx4bsQpEhvmD/test_YWNjdF8xUmJWSHg0YnNRcEVodm1ELF9TWnp6NEVhWVNNT1JHUUljcEJoVEFMekNLQjhFc3ZvLDE0MTYyNDI1MA0200fIcw4AWq?s=ap\", \"status_transitions\": {\"paid_at\": 1751083447, \"voided_at\": null, \"finalized_at\": 1751083447, \"marked_uncollectible_at\": null}, \"customer_tax_exempt\": \"none\", \"total_excluding_tax\": 1500, \"next_payment_attempt\": null, \"statement_descriptor\": null, \"webhooks_delivered_at\": 1751083447, \"default_payment_method\": null, \"subtotal_excluding_tax\": 1500, \"total_discount_amounts\": [], \"last_finalization_error\": null, \"automatically_finalizes_at\": null, \"total_pretax_credit_amounts\": [], \"pre_payment_credit_notes_amount\": 0, \"post_payment_credit_notes_amount\": 0}}, \"type\": \"invoice.payment_succeeded\", \"object\": \"event\", \"created\": 1751083449, \"request\": {\"id\": \"req_dCM7nEXmJZJU1d\", \"idempotency_key\": \"472fde59-cf1d-4897-b2d0-ba40723d248d\"}, \"livemode\": false, \"api_version\": \"2025-05-28.basil\", \"pending_webhooks\": 1}','processed',NULL),('84335480-14e5-4f0b-92d2-752e84b57d0c','evt_test_subscription_1751149735349','customer.subscription.created',NULL,NULL,'2025-06-28 22:28:56','{\"id\": \"evt_test_subscription_1751149735349\", \"data\": {\"object\": {\"id\": \"sub_test_1751149735349\", \"items\": {\"data\": [{\"price\": {\"id\": \"price_1RbVjX4bsQpEhvmDr2Oay1cp\"}}]}, \"object\": \"subscription\", \"status\": \"active\", \"customer\": \"cus_test_1751149735349\", \"metadata\": {\"owner_email\": \"a.jonline@yahoo.com\", \"organization_name\": \"dev123\"}}}, \"type\": \"customer.subscription.created\", \"object\": \"event\", \"created\": 1751149735, \"request\": {\"id\": null, \"idempotency_key\": null}, \"livemode\": false, \"api_version\": \"2023-10-16\", \"pending_webhooks\": 1}','processed',NULL),('9ef9a7ca-0e76-43dc-b690-143c16b4299b','evt_test_webhook','customer.subscription.created',NULL,NULL,'2025-06-28 01:55:58','{\"id\": \"evt_test_webhook\", \"data\": {\"object\": {\"id\": \"sub_test_12345\", \"items\": {\"data\": [{\"price\": {\"id\": \"price_1RbVjX4bsQpEhvmDr2Oay1cp\"}}]}, \"object\": \"subscription\", \"status\": \"active\", \"customer\": \"cus_test_12345\", \"metadata\": {\"owner_email\": \"a.jonline@yahoo.com\", \"organization_name\": \"Dev Stripe\"}, \"current_period_end\": 1753667758, \"current_period_start\": 1751075758}}, \"type\": \"customer.subscription.created\", \"object\": \"event\", \"created\": 1751075758, \"api_version\": \"2020-08-27\"}','failed','No such customer: \'cus_test_12345\''),('a2a3648d-d1d5-4d5d-9c5c-e6631c6cacfb','evt_1Repzp4bsQpEhvmDXoBgsI2K','customer.subscription.created',NULL,NULL,'2025-06-28 04:04:10','{\"id\": \"evt_1Repzp4bsQpEhvmDXoBgsI2K\", \"data\": {\"object\": {\"id\": \"sub_1Repzn4bsQpEhvmDsy2AcXt3\", \"plan\": {\"id\": \"price_1Repzm4bsQpEhvmDpn8OqGmE\", \"meter\": null, \"active\": true, \"amount\": 1500, \"object\": \"plan\", \"created\": 1751083446, \"product\": \"prod_SZzzobHGwDARCn\", \"currency\": \"usd\", \"interval\": \"month\", \"livemode\": false, \"metadata\": {}, \"nickname\": null, \"tiers_mode\": null, \"usage_type\": \"licensed\", \"amount_decimal\": \"1500\", \"billing_scheme\": \"per_unit\", \"interval_count\": 1, \"transform_usage\": null, \"trial_period_days\": null}, \"items\": {\"url\": \"/v1/subscription_items?subscription=sub_1Repzn4bsQpEhvmDsy2AcXt3\", \"data\": [{\"id\": \"si_SZzzkCJ1ZW6pfs\", \"plan\": {\"id\": \"price_1Repzm4bsQpEhvmDpn8OqGmE\", \"meter\": null, \"active\": true, \"amount\": 1500, \"object\": \"plan\", \"created\": 1751083446, \"product\": \"prod_SZzzobHGwDARCn\", \"currency\": \"usd\", \"interval\": \"month\", \"livemode\": false, \"metadata\": {}, \"nickname\": null, \"tiers_mode\": null, \"usage_type\": \"licensed\", \"amount_decimal\": \"1500\", \"billing_scheme\": \"per_unit\", \"interval_count\": 1, \"transform_usage\": null, \"trial_period_days\": null}, \"price\": {\"id\": \"price_1Repzm4bsQpEhvmDpn8OqGmE\", \"type\": \"recurring\", \"active\": true, \"object\": \"price\", \"created\": 1751083446, \"product\": \"prod_SZzzobHGwDARCn\", \"currency\": \"usd\", \"livemode\": false, \"metadata\": {}, \"nickname\": null, \"recurring\": {\"meter\": null, \"interval\": \"month\", \"usage_type\": \"licensed\", \"interval_count\": 1, \"trial_period_days\": null}, \"lookup_key\": null, \"tiers_mode\": null, \"unit_amount\": 1500, \"tax_behavior\": \"unspecified\", \"billing_scheme\": \"per_unit\", \"custom_unit_amount\": null, \"transform_quantity\": null, \"unit_amount_decimal\": \"1500\"}, \"object\": \"subscription_item\", \"created\": 1751083447, \"metadata\": {}, \"quantity\": 1, \"discounts\": [], \"tax_rates\": [], \"subscription\": \"sub_1Repzn4bsQpEhvmDsy2AcXt3\", \"billing_thresholds\": null, \"current_period_end\": 1753675447, \"current_period_start\": 1751083447}], \"object\": \"list\", \"has_more\": false, \"total_count\": 1}, \"object\": \"subscription\", \"status\": \"active\", \"created\": 1751083447, \"currency\": \"usd\", \"customer\": \"cus_SZzz5r9mMsh6fp\", \"ended_at\": null, \"livemode\": false, \"metadata\": {}, \"quantity\": 1, \"schedule\": null, \"cancel_at\": null, \"discounts\": [], \"trial_end\": null, \"start_date\": 1751083447, \"test_clock\": null, \"application\": null, \"canceled_at\": null, \"description\": null, \"trial_start\": null, \"billing_mode\": {\"type\": \"classic\"}, \"on_behalf_of\": null, \"automatic_tax\": {\"enabled\": false, \"liability\": null, \"disabled_reason\": null}, \"transfer_data\": null, \"days_until_due\": null, \"default_source\": null, \"latest_invoice\": \"in_1Repzn4bsQpEhvmD8IQuhapD\", \"pending_update\": null, \"trial_settings\": {\"end_behavior\": {\"missing_payment_method\": \"create_invoice\"}}, \"invoice_settings\": {\"issuer\": {\"type\": \"self\"}, \"account_tax_ids\": null}, \"pause_collection\": null, \"payment_settings\": {\"payment_method_types\": null, \"payment_method_options\": null, \"save_default_payment_method\": \"off\"}, \"collection_method\": \"charge_automatically\", \"default_tax_rates\": [], \"billing_thresholds\": null, \"billing_cycle_anchor\": 1751083447, \"cancel_at_period_end\": false, \"cancellation_details\": {\"reason\": null, \"comment\": null, \"feedback\": null}, \"pending_setup_intent\": null, \"default_payment_method\": null, \"application_fee_percent\": null, \"billing_cycle_anchor_config\": null, \"pending_invoice_item_interval\": null, \"next_pending_invoice_item_invoice\": null}}, \"type\": \"customer.subscription.created\", \"object\": \"event\", \"created\": 1751083449, \"request\": {\"id\": \"req_dCM7nEXmJZJU1d\", \"idempotency_key\": \"472fde59-cf1d-4897-b2d0-ba40723d248d\"}, \"livemode\": false, \"api_version\": \"2025-05-28.basil\", \"pending_webhooks\": 1}','failed','No license tier found for Stripe price ID: price_1Repzm4bsQpEhvmDpn8OqGmE'),('c689817f-4749-485c-bd08-3180c89800e6','evt_test_dev_stripe_1751083831218','customer.subscription.created',NULL,NULL,'2025-06-28 04:10:31','{\"id\": \"evt_test_dev_stripe_1751083831218\", \"data\": {\"object\": {\"id\": \"sub_test_dev_stripe_1751083831218\", \"items\": {\"data\": [{\"price\": {\"id\": \"price_1RbVjX4bsQpEhvmDr2Oay1cp\"}}]}, \"object\": \"subscription\", \"status\": \"active\", \"customer\": \"cus_test_dev_stripe\", \"metadata\": {\"owner_email\": \"a.jonline@yahoo.com\", \"organization_name\": \"Dev Stripe\"}, \"current_period_end\": 1753675831, \"current_period_start\": 1751083831}}, \"type\": \"customer.subscription.created\", \"object\": \"event\", \"created\": 1751083831, \"api_version\": \"2020-08-27\"}','failed','No such customer: \'cus_test_dev_stripe\''),('d16a4736-3fef-4916-99d1-dadd308aec7d','evt_test_subscription_1751149829565','customer.subscription.created',NULL,NULL,'2025-06-28 22:30:30','{\"id\": \"evt_test_subscription_1751149829565\", \"data\": {\"object\": {\"id\": \"sub_test_1751149829565\", \"items\": {\"data\": [{\"price\": {\"id\": \"price_1RbVjX4bsQpEhvmDr2Oay1cp\"}}]}, \"object\": \"subscription\", \"status\": \"active\", \"customer\": \"cus_test_1751149829565\", \"metadata\": {\"owner_email\": \"a.jonline@yahoo.com\", \"organization_name\": \"dev123\"}}}, \"type\": \"customer.subscription.created\", \"object\": \"event\", \"created\": 1751149829, \"request\": {\"id\": null, \"idempotency_key\": null}, \"livemode\": false, \"api_version\": \"2023-10-16\", \"pending_webhooks\": 1}','failed','Incorrect datetime value: \'0000-00-00 00:00:00\' for column \'current_period_start\' at row 1'),('e48fc256-26c5-4173-83fd-ee16e34cad1f','evt_test_dev_stripe_1751084342619','customer.subscription.created',NULL,NULL,'2025-06-28 04:19:02','{\"id\": \"evt_test_dev_stripe_1751084342619\", \"data\": {\"object\": {\"id\": \"sub_test_dev_stripe_1751084342619\", \"items\": {\"data\": [{\"price\": {\"id\": \"price_1RbVjX4bsQpEhvmDr2Oay1cp\"}}]}, \"object\": \"subscription\", \"status\": \"active\", \"customer\": \"cus_test_dev_stripe\", \"metadata\": {\"owner_email\": \"a.jonline@yahoo.com\", \"organization_name\": \"Dev Stripe\"}, \"current_period_end\": 1753676342, \"current_period_start\": 1751084342}}, \"type\": \"customer.subscription.created\", \"object\": \"event\", \"created\": 1751084342, \"api_version\": \"2020-08-27\"}','processed',NULL),('e979d476-75cc-44c7-a8a5-ebfa28798bcc','evt_1RfwiT4bsQpEhvmD8ZH2zzkI','customer.subscription.created',NULL,NULL,'2025-07-01 05:26:51','{\"id\": \"evt_1RfwiT4bsQpEhvmD8ZH2zzkI\", \"data\": {\"object\": {\"id\": \"sub_1RfwiS4bsQpEhvmDHWXPlAfv\", \"plan\": {\"id\": \"price_1RbVjX4bsQpEhvmDr2Oay1cp\", \"meter\": null, \"active\": true, \"amount\": 7999, \"object\": \"plan\", \"created\": 1750290575, \"product\": \"prod_SWYraUKXbsE80F\", \"currency\": \"usd\", \"interval\": \"month\", \"livemode\": false, \"metadata\": {}, \"nickname\": \"Up to 30 Active Cars + Unlimited Sold Cars\", \"tiers_mode\": null, \"usage_type\": \"licensed\", \"amount_decimal\": \"7999\", \"billing_scheme\": \"per_unit\", \"interval_count\": 1, \"transform_usage\": null, \"trial_period_days\": null}, \"items\": {\"url\": \"/v1/subscription_items?subscription=sub_1RfwiS4bsQpEhvmDHWXPlAfv\", \"data\": [{\"id\": \"si_Sb90QXAbyGd22Y\", \"plan\": {\"id\": \"price_1RbVjX4bsQpEhvmDr2Oay1cp\", \"meter\": null, \"active\": true, \"amount\": 7999, \"object\": \"plan\", \"created\": 1750290575, \"product\": \"prod_SWYraUKXbsE80F\", \"currency\": \"usd\", \"interval\": \"month\", \"livemode\": false, \"metadata\": {}, \"nickname\": \"Up to 30 Active Cars + Unlimited Sold Cars\", \"tiers_mode\": null, \"usage_type\": \"licensed\", \"amount_decimal\": \"7999\", \"billing_scheme\": \"per_unit\", \"interval_count\": 1, \"transform_usage\": null, \"trial_period_days\": null}, \"price\": {\"id\": \"price_1RbVjX4bsQpEhvmDr2Oay1cp\", \"type\": \"recurring\", \"active\": true, \"object\": \"price\", \"created\": 1750290575, \"product\": \"prod_SWYraUKXbsE80F\", \"currency\": \"usd\", \"livemode\": false, \"metadata\": {}, \"nickname\": \"Up to 30 Active Cars + Unlimited Sold Cars\", \"recurring\": {\"meter\": null, \"interval\": \"month\", \"usage_type\": \"licensed\", \"interval_count\": 1, \"trial_period_days\": null}, \"lookup_key\": \"starter\", \"tiers_mode\": null, \"unit_amount\": 7999, \"tax_behavior\": \"unspecified\", \"billing_scheme\": \"per_unit\", \"custom_unit_amount\": null, \"transform_quantity\": null, \"unit_amount_decimal\": \"7999\"}, \"object\": \"subscription_item\", \"created\": 1751347608, \"metadata\": {}, \"quantity\": 1, \"discounts\": [], \"tax_rates\": [], \"subscription\": \"sub_1RfwiS4bsQpEhvmDHWXPlAfv\", \"billing_thresholds\": null, \"current_period_end\": 1754026007, \"current_period_start\": 1751347607}], \"object\": \"list\", \"has_more\": false, \"total_count\": 1}, \"object\": \"subscription\", \"status\": \"active\", \"created\": 1751347607, \"currency\": \"usd\", \"customer\": \"cus_Sb90UGuRZfKMx7\", \"ended_at\": null, \"livemode\": false, \"metadata\": {}, \"quantity\": 1, \"schedule\": null, \"cancel_at\": null, \"discounts\": [], \"trial_end\": null, \"start_date\": 1751347607, \"test_clock\": null, \"application\": null, \"canceled_at\": null, \"description\": null, \"trial_start\": null, \"billing_mode\": {\"type\": \"classic\"}, \"on_behalf_of\": null, \"automatic_tax\": {\"enabled\": false, \"liability\": null, \"disabled_reason\": null}, \"transfer_data\": null, \"days_until_due\": null, \"default_source\": null, \"latest_invoice\": \"in_1RfwiT4bsQpEhvmDz2HgqWFw\", \"pending_update\": null, \"trial_settings\": {\"end_behavior\": {\"missing_payment_method\": \"create_invoice\"}}, \"invoice_settings\": {\"issuer\": {\"type\": \"self\"}, \"account_tax_ids\": null}, \"pause_collection\": null, \"payment_settings\": {\"payment_method_types\": [\"card\"], \"payment_method_options\": {\"card\": {\"network\": null, \"request_three_d_secure\": \"automatic\"}, \"konbini\": null, \"acss_debit\": null, \"bancontact\": null, \"sepa_debit\": null, \"us_bank_account\": null, \"customer_balance\": null}, \"save_default_payment_method\": \"off\"}, \"collection_method\": \"charge_automatically\", \"default_tax_rates\": [], \"billing_thresholds\": null, \"billing_cycle_anchor\": 1751347607, \"cancel_at_period_end\": false, \"cancellation_details\": {\"reason\": null, \"comment\": null, \"feedback\": null}, \"pending_setup_intent\": null, \"default_payment_method\": \"pm_1RfwiQ4bsQpEhvmDzMNOCaCb\", \"application_fee_percent\": null, \"billing_cycle_anchor_config\": null, \"pending_invoice_item_interval\": null, \"next_pending_invoice_item_invoice\": null}}, \"type\": \"customer.subscription.created\", \"object\": \"event\", \"created\": 1751347609, \"request\": {\"id\": null, \"idempotency_key\": \"182b6f93-3bb8-498b-b767-eb773f3a46a8\"}, \"livemode\": false, \"api_version\": \"2025-05-28.basil\", \"pending_webhooks\": 1}','processed',NULL);
/*!40000 ALTER TABLE `stripe_events` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_roles`
--

DROP TABLE IF EXISTS `user_roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_roles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `role_name` varchar(20) COLLATE utf8mb4_general_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `role_name` (`role_name`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_roles`
--

LOCK TABLES `user_roles` WRITE;
/*!40000 ALTER TABLE `user_roles` DISABLE KEYS */;
INSERT INTO `user_roles` VALUES (1,'owner','2025-06-18 00:45:07'),(2,'manager','2025-06-18 00:45:07'),(3,'operator','2025-06-18 00:45:07');
/*!40000 ALTER TABLE `user_roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `organization_id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `password` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `first_name` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `last_name` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `role_id` int DEFAULT '3',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `organization_id` (`organization_id`),
  KEY `role_id` (`role_id`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`),
  CONSTRAINT `users_ibfk_2` FOREIGN KEY (`role_id`) REFERENCES `user_roles` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES ('1289b2c8-5228-4da3-b6ed-04ab534b3c27','36debc90-59df-4db4-af5d-78ef4c001ae2','ma@carfin.com','$2b$10$mUFkQJaHjtiVgWAlSIh.V.xa4qoTopVW1K3J5TdatgknanOZuXH.O','Manager','User',2,'2025-05-27 17:13:00','2025-06-18 02:08:08'),('84259fc4-0cfd-4585-a1fa-8a6d36be427b','36debc90-59df-4db4-af5d-78ef4c001ae2','op@carfin.com','$2b$10$mUFkQJaHjtiVgWAlSIh.V.xa4qoTopVW1K3J5TdatgknanOZuXH.O','Operator','User',3,'2025-05-27 17:13:00','2025-06-18 02:08:08'),('8a010f1c-59c0-421e-bc32-c79fc2a24ed4','3f0a0b11-3ae6-4a88-b16d-317023fddb83','a.jonline@yahoo.com','$2b$10$XdLT6T1Dpt5ZB00PWA6zD.Qfktfahzvc2R2/VTK.nUANAvSV51tqO','Owner','User',1,'2025-07-01 05:26:54','2025-07-01 23:12:52'),('b39334f8-e129-4949-8fd6-eb628bffdbd5','36debc90-59df-4db4-af5d-78ef4c001ae2','admin@carfin.com','$2b$10$VvJMSLVl6Eso/E1alp63J.Tpw7lO3IKeO0QQoOQkwcEeFaddaWQDG','Admin','User',1,'2025-05-27 17:13:00','2025-06-18 22:42:45');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'carfindev_dancenight'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-07-03  8:03:52
