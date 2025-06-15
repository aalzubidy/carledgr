-- MySQL dump 10.13  Distrib 8.0.42, for Linux (x86_64)
--
-- Host: localhost    Database: carfin
-- ------------------------------------------------------
-- Server version	8.0.42-0ubuntu0.24.04.1

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
  `id` varchar(36) NOT NULL,
  `organization_id` varchar(36) NOT NULL,
  `vin` varchar(17) NOT NULL,
  `make` varchar(50) NOT NULL,
  `model` varchar(50) NOT NULL,
  `year` int NOT NULL,
  `color` varchar(30) DEFAULT NULL,
  `mileage` int DEFAULT '0',
  `purchase_date` date NOT NULL,
  `purchase_price` decimal(10,2) NOT NULL,
  `sale_date` date DEFAULT NULL,
  `sale_price` decimal(10,2) DEFAULT NULL,
  `status` enum('in_stock','sold','pending') DEFAULT 'in_stock',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `organization_id` (`organization_id`),
  CONSTRAINT `cars_ibfk_1` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cars`
--

LOCK TABLES `cars` WRITE;
/*!40000 ALTER TABLE `cars` DISABLE KEYS */;
INSERT INTO `cars` VALUES ('12fe0221-fd19-4fe5-9b14-b37926742470','36debc90-59df-4db4-af5d-78ef4c001ae2','TEST987654321EFGH','Honda','Civic',2021,'Red',67522,'2023-02-20',22000.00,'2025-05-15',25000.00,'sold','2025-05-28 11:56:07','2025-06-14 16:42:15'),('2cc31065-0fb7-4609-8d08-51da64d5c4cc','36debc90-59df-4db4-af5d-78ef4c001ae2','A2345678912145678','Nissan','Altima',2020,'White',73201,'2025-05-13',31000.00,'2025-06-02',45000.00,'sold','2025-06-02 16:47:15','2025-06-14 16:42:15'),('6b2de218-ba50-4c64-ae13-d874915ab5dd','36debc90-59df-4db4-af5d-78ef4c001ae2','TEST555666777IJKL','Ford','Focus',2019,'White',153440,'2023-03-10',18000.00,'2024-01-20',20000.00,'sold','2025-05-28 11:56:07','2025-06-14 16:42:15'),('701922e2-fbe6-41b4-a7dd-3ee5fb0c360f','36debc90-59df-4db4-af5d-78ef4c001ae2','JN1CA21D8XT223244','NISSAN','Maxima',1999,'White',137596,'2025-06-14',5000.00,NULL,NULL,'pending','2025-06-14 16:26:44','2025-06-14 16:49:26'),('bcb8f8ee-0489-4509-a8d8-ac5404440090','36debc90-59df-4db4-af5d-78ef4c001ae2','12345678912345678','Nissan','Altima',2020,'White',17663,'2025-05-27',13000.00,NULL,NULL,'in_stock','2025-05-27 17:52:28','2025-06-14 16:42:15'),('c3306a8c-3bce-11f0-ab0b-6479f0559d3f','36debc90-59df-4db4-af5d-78ef4c001ae2','WBAFR7C50BC123456','BMW','3 Series',2020,NULL,65528,'2025-03-15',25000.00,'2025-04-20',28500.00,'sold','2025-05-28 14:19:27','2025-06-14 16:42:15'),('c339a74c-3bce-11f0-ab0b-6479f0559d3f','36debc90-59df-4db4-af5d-78ef4c001ae2','WBAFR7C50BC123457','BMW','X5',2019,NULL,64650,'2025-03-10',35000.00,'2025-04-25',39000.00,'sold','2025-05-28 14:19:27','2025-06-14 16:42:15'),('c339a9a1-3bce-11f0-ab0b-6479f0559d3f','36debc90-59df-4db4-af5d-78ef4c001ae2','WBAFR7C50BC123458','Mercedes','C-Class',2021,NULL,116668,'2025-03-20',30000.00,'2025-05-05',34000.00,'sold','2025-05-28 14:19:27','2025-06-14 16:42:15'),('c339e0be-3bce-11f0-ab0b-6479f0559d3f','36debc90-59df-4db4-af5d-78ef4c001ae2','WBAFR7C50BC123459','Mercedes','E-Class',2020,NULL,179389,'2025-03-25',40000.00,'2025-05-10',45000.00,'sold','2025-05-28 14:19:27','2025-06-14 16:42:15'),('c33a0d9e-3bce-11f0-ab0b-6479f0559d3f','36debc90-59df-4db4-af5d-78ef4c001ae2','WBAFR7C50BC123460','Audi','A4',2021,NULL,136942,'2025-04-01',28000.00,'2025-05-15',32000.00,'sold','2025-05-28 14:19:27','2025-06-14 16:42:15'),('ca4b012b-3bce-11f0-ab0b-6479f0559d3f','36debc90-59df-4db4-af5d-78ef4c001ae2','WBAFR7C50BC123461','Audi','Q5',2020,NULL,136544,'2025-04-05',38000.00,'2025-05-20',42000.00,'sold','2025-05-28 14:19:39','2025-06-14 16:42:15'),('ca4b3be8-3bce-11f0-ab0b-6479f0559d3f','36debc90-59df-4db4-af5d-78ef4c001ae2','WBAFR7C50BC123462','Toyota','Camry',2022,NULL,61896,'2025-04-10',22000.00,'2025-05-25',25000.00,'sold','2025-05-28 14:19:39','2025-06-14 16:42:15'),('ca4b615d-3bce-11f0-ab0b-6479f0559d3f','36debc90-59df-4db4-af5d-78ef4c001ae2','WBAFR7C50BC123463','Toyota','RAV4',2021,NULL,89845,'2025-04-15',26000.00,'2025-05-30',29000.00,'sold','2025-05-28 14:19:39','2025-06-14 16:42:15'),('ca4b8aba-3bce-11f0-ab0b-6479f0559d3f','36debc90-59df-4db4-af5d-78ef4c001ae2','WBAFR7C50BC123464','Honda','Accord',2022,NULL,53540,'2025-04-20',24000.00,'2025-06-01',27000.00,'sold','2025-05-28 14:19:39','2025-06-14 16:42:15'),('ca4cd307-3bce-11f0-ab0b-6479f0559d3f','36debc90-59df-4db4-af5d-78ef4c001ae2','WBAFR7C50BC123465','Honda','CR-V',2021,NULL,188164,'2025-04-25',27000.00,'2025-06-05',30000.00,'sold','2025-05-28 14:19:39','2025-06-14 16:42:15'),('d7676b8f-cae3-44c4-93b4-4adef7f13d1d','36debc90-59df-4db4-af5d-78ef4c001ae2','12345678912345678','Nissan','Altima',2016,'White',170200,'2024-04-27',15000.00,NULL,NULL,'in_stock','2025-05-28 13:29:13','2025-06-14 16:42:15'),('f02e727f-3bce-11f0-ab0b-6479f0559d3f','36debc90-59df-4db4-af5d-78ef4c001ae2','WBAFR7C50BC123466','Ford','F-150',2020,NULL,76509,'2025-05-01',32000.00,'2025-06-10',36000.00,'sold','2025-05-28 14:20:42','2025-06-14 16:42:15'),('f02e99fc-3bce-11f0-ab0b-6479f0559d3f','36debc90-59df-4db4-af5d-78ef4c001ae2','WBAFR7C50BC123467','Ford','Escape',2021,NULL,61946,'2025-05-05',23000.00,'2025-06-15',26000.00,'sold','2025-05-28 14:20:42','2025-06-14 16:42:15'),('f02eacbb-3bce-11f0-ab0b-6479f0559d3f','36debc90-59df-4db4-af5d-78ef4c001ae2','WBAFR7C50BC123468','Chevrolet','Malibu',2022,NULL,70205,'2025-05-10',21000.00,'2025-06-20',24000.00,'sold','2025-05-28 14:20:42','2025-06-14 16:42:15'),('f02eb1f4-3bce-11f0-ab0b-6479f0559d3f','36debc90-59df-4db4-af5d-78ef4c001ae2','WBAFR7C50BC123469','Chevrolet','Equinox',2021,NULL,155187,'2025-05-15',25000.00,'2025-06-25',28000.00,'sold','2025-05-28 14:20:42','2025-06-14 16:42:15'),('f02eca5a-3bce-11f0-ab0b-6479f0559d3f','36debc90-59df-4db4-af5d-78ef4c001ae2','WBAFR7C50BC123470','Nissan','Altima',2022,NULL,155321,'2025-05-20',20000.00,'2025-06-30',23000.00,'sold','2025-05-28 14:20:42','2025-06-14 16:42:15'),('fd20314e-3bce-11f0-ab0b-6479f0559d3f','36debc90-59df-4db4-af5d-78ef4c001ae2','WBAFR7C50BC123471','Nissan','Altima',2021,'Black',101042,'2025-05-25',24000.00,'2025-07-01',27000.00,'sold','2025-05-28 14:21:04','2025-06-14 16:42:15'),('fd205280-3bce-11f0-ab0b-6479f0559d3f','36debc90-59df-4db4-af5d-78ef4c001ae2','WBAFR7C50BC123472','Hyundai','Elantra',2022,NULL,29248,'2025-05-30',18000.00,'2025-07-05',21000.00,'sold','2025-05-28 14:21:04','2025-06-14 16:42:15'),('fd209ab0-3bce-11f0-ab0b-6479f0559d3f','36debc90-59df-4db4-af5d-78ef4c001ae2','WBAFR7C50BC123475','Kia','Sorento',2020,'White',33117,'2025-06-10',28000.00,'2025-07-20',31000.00,'pending','2025-05-28 14:21:04','2025-06-14 16:42:15');
/*!40000 ALTER TABLE `cars` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `maintenance_categories`
--

DROP TABLE IF EXISTS `maintenance_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `maintenance_categories` (
  `id` varchar(36) NOT NULL,
  `name` varchar(50) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `maintenance_categories`
--

LOCK TABLES `maintenance_categories` WRITE;
/*!40000 ALTER TABLE `maintenance_categories` DISABLE KEYS */;
INSERT INTO `maintenance_categories` VALUES ('10389d23-be57-4ad9-801c-88566a025011','General Maintenance','2025-05-27 17:13:00','2025-05-27 17:13:00'),('22020294-8bb6-43ca-b7fe-a06ac012ea42','Interior','2025-05-27 17:13:00','2025-05-27 17:13:00'),('415f9500-cdd4-4596-a015-90f7f0ba7770','Transmission','2025-05-27 17:13:00','2025-05-27 17:13:00'),('428f70fd-37be-4e4a-a998-d3c577835589','Tires','2025-05-27 17:13:00','2025-05-27 17:13:00'),('66d5a74a-8583-47e4-86d6-6635cee717bf','Engine','2025-05-27 17:13:00','2025-05-27 17:13:00'),('68b699b5-18d4-42a7-987a-d969bcce0a03','Body','2025-05-27 17:13:00','2025-05-27 17:13:00'),('7e755154-d85c-4993-beab-51d11d033fb9','Brakes','2025-05-27 17:13:00','2025-05-27 17:13:00'),('8e8ac303-493a-11f0-acc9-bcec23c373a5','Taxes','2025-06-14 16:13:49','2025-06-14 16:13:49'),('8e8ac62c-493a-11f0-acc9-bcec23c373a5','Fees','2025-06-14 16:13:49','2025-06-14 16:13:49'),('8e8ac69f-493a-11f0-acc9-bcec23c373a5','In State Tax','2025-06-14 16:13:49','2025-06-14 16:13:49'),('8e8ac715-493a-11f0-acc9-bcec23c373a5','Out of State Tax','2025-06-14 16:13:49','2025-06-14 16:13:49'),('987ece51-59eb-4458-a838-fa033fb67b17','Suspension','2025-05-27 17:13:00','2025-05-27 17:13:00'),('c8df32ab-ef2b-48da-a089-17781d6c7b97','Electrical','2025-05-27 17:13:00','2025-05-27 17:13:00'),('cae24cb3-094a-4ed4-baa0-2a198aa84c19','Other','2025-05-27 17:13:00','2025-05-27 17:13:00'),('d19bfc90-3c11-11f0-ab0b-6479f0559d3f','Gas','2025-05-28 22:19:27','2025-05-28 22:19:27'),('d19c30eb-3c11-11f0-ab0b-6479f0559d3f','Holding Cost','2025-05-28 22:19:27','2025-05-28 22:19:27'),('d19c36dc-3c11-11f0-ab0b-6479f0559d3f','Towing','2025-05-28 22:19:27','2025-05-28 22:19:27'),('d19c3bbe-3c11-11f0-ab0b-6479f0559d3f','Parking','2025-05-28 22:19:27','2025-05-28 22:19:27'),('ecfe82a3-c143-4d23-b331-d55cd9e253cf','Oil Change','2025-05-27 17:13:00','2025-05-27 17:13:00');
/*!40000 ALTER TABLE `maintenance_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `maintenance_records`
--

DROP TABLE IF EXISTS `maintenance_records`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `maintenance_records` (
  `id` varchar(36) NOT NULL,
  `car_id` varchar(36) NOT NULL,
  `category_id` varchar(36) NOT NULL,
  `description` varchar(255) NOT NULL,
  `cost` decimal(10,2) NOT NULL,
  `maintenance_date` date NOT NULL,
  `vendor` varchar(100) DEFAULT NULL,
  `notes` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `car_id` (`car_id`),
  KEY `category_id` (`category_id`),
  CONSTRAINT `maintenance_records_ibfk_1` FOREIGN KEY (`car_id`) REFERENCES `cars` (`id`) ON DELETE CASCADE,
  CONSTRAINT `maintenance_records_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `maintenance_categories` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `maintenance_records`
--

LOCK TABLES `maintenance_records` WRITE;
/*!40000 ALTER TABLE `maintenance_records` DISABLE KEYS */;
INSERT INTO `maintenance_records` VALUES ('192007d5-3bcf-11f0-ab0b-6479f0559d3f','c3306a8c-3bce-11f0-ab0b-6479f0559d3f','ecfe82a3-c143-4d23-b331-d55cd9e253cf','Oil Change',45.99,'2025-03-20','Quick Lube','Regular maintenance','2025-05-28 14:21:51','2025-05-28 14:21:51'),('19200ba0-3bcf-11f0-ab0b-6479f0559d3f','c339a74c-3bce-11f0-ab0b-6479f0559d3f','7e755154-d85c-4993-beab-51d11d033fb9','Brake Pads Replacement',189.50,'2025-03-15','Auto Parts Plus','Front brake pads','2025-05-28 14:21:51','2025-05-28 14:21:51'),('19200c83-3bcf-11f0-ab0b-6479f0559d3f','c339a9a1-3bce-11f0-ab0b-6479f0559d3f','428f70fd-37be-4e4a-a998-d3c577835589','Tire Rotation',35.00,'2025-03-25','Tire Center','Routine tire rotation','2025-05-28 14:21:51','2025-05-28 14:21:51'),('192a5284-3bcf-11f0-ab0b-6479f0559d3f','c339e0be-3bce-11f0-ab0b-6479f0559d3f','ecfe82a3-c143-4d23-b331-d55cd9e253cf','Oil Change',52.99,'2025-04-01','Express Oil','Synthetic oil','2025-05-28 14:21:51','2025-05-28 14:21:51'),('192a53da-3bcf-11f0-ab0b-6479f0559d3f','c33a0d9e-3bce-11f0-ab0b-6479f0559d3f','10389d23-be57-4ad9-801c-88566a025011','Air Filter Replacement',25.99,'2025-04-10','Auto Zone','Engine air filter','2025-05-28 14:21:51','2025-05-28 14:21:51'),('2b6f1cac-3bcf-11f0-ab0b-6479f0559d3f','ca4b3be8-3bce-11f0-ab0b-6479f0559d3f','ecfe82a3-c143-4d23-b331-d55cd9e253cf','Oil Change',48.99,'2025-04-15','Valvoline Instant','Full synthetic','2025-05-28 14:22:22','2025-05-28 14:22:22'),('2b6f21fd-3bcf-11f0-ab0b-6479f0559d3f','ca4b615d-3bce-11f0-ab0b-6479f0559d3f','987ece51-59eb-4458-a838-fa033fb67b17','Shock Absorber Check',75.00,'2025-04-20','Suspension Pro','Inspection only','2025-05-28 14:22:22','2025-05-28 14:22:22'),('2b6f234f-3bcf-11f0-ab0b-6479f0559d3f','ca4b8aba-3bce-11f0-ab0b-6479f0559d3f','428f70fd-37be-4e4a-a998-d3c577835589','Tire Balancing',60.00,'2025-04-25','Discount Tire','All four tires','2025-05-28 14:22:22','2025-05-28 14:22:22'),('2b78848d-3bcf-11f0-ab0b-6479f0559d3f','ca4cd307-3bce-11f0-ab0b-6479f0559d3f','ecfe82a3-c143-4d23-b331-d55cd9e253cf','Oil Change',55.99,'2025-05-01','Jiffy Lube','High mileage oil','2025-05-28 14:22:22','2025-05-28 14:22:22'),('2b788780-3bcf-11f0-ab0b-6479f0559d3f','f02e727f-3bce-11f0-ab0b-6479f0559d3f','66d5a74a-8583-47e4-86d6-6635cee717bf','Spark Plug Replacement',125.00,'2025-05-05','Engine Works','All 8 plugs','2025-05-28 14:22:22','2025-05-28 14:22:22'),('33fbbc27-3bcf-11f0-ab0b-6479f0559d3f','f02e99fc-3bce-11f0-ab0b-6479f0559d3f','7e755154-d85c-4993-beab-51d11d033fb9','Brake Fluid Change',89.99,'2025-05-10','Brake Masters','DOT 4 fluid','2025-05-28 14:22:36','2025-05-28 14:22:36'),('33fbc0a3-3bcf-11f0-ab0b-6479f0559d3f','f02eacbb-3bce-11f0-ab0b-6479f0559d3f','ecfe82a3-c143-4d23-b331-d55cd9e253cf','Oil Change',42.99,'2025-05-15','Quick Change','Conventional oil','2025-05-28 14:22:36','2025-05-28 14:22:36'),('33fbc1a4-3bcf-11f0-ab0b-6479f0559d3f','f02eb1f4-3bce-11f0-ab0b-6479f0559d3f','22020294-8bb6-43ca-b7fe-a06ac012ea42','Cabin Air Filter',29.99,'2025-05-20','Filter Pro','HEPA filter','2025-05-28 14:22:36','2025-05-28 14:22:36'),('33fbc23c-3bcf-11f0-ab0b-6479f0559d3f','f02eca5a-3bce-11f0-ab0b-6479f0559d3f','428f70fd-37be-4e4a-a998-d3c577835589','Tire Pressure Check',15.00,'2025-05-25','Gas Station Pro','All tires adjusted','2025-05-28 14:22:36','2025-05-28 14:22:36'),('33fbc2d0-3bcf-11f0-ab0b-6479f0559d3f','fd20314e-3bce-11f0-ab0b-6479f0559d3f','c8df32ab-ef2b-48da-a089-17781d6c7b97','Battery Test',25.00,'2025-05-30','Battery Plus','Load test passed','2025-05-28 14:22:36','2025-05-28 14:22:36'),('417d8e68-4b0d-4207-a1b6-683c32824702','bcb8f8ee-0489-4509-a8d8-ac5404440090','c8df32ab-ef2b-48da-a089-17781d6c7b97','New headlights',1200.00,'2025-05-28','In Home','New headlights installed','2025-05-28 11:05:12','2025-05-28 11:05:12'),('5b31a924-3bcf-11f0-ab0b-6479f0559d3f','fd205280-3bce-11f0-ab0b-6479f0559d3f','ecfe82a3-c143-4d23-b331-d55cd9e253cf','Oil Change',39.99,'2025-06-01','Economy Lube','Basic oil change','2025-05-28 14:23:42','2025-05-28 14:23:42'),('5b31ae76-3bcf-11f0-ab0b-6479f0559d3f','fd209ab0-3bce-11f0-ab0b-6479f0559d3f','7e755154-d85c-4993-beab-51d11d033fb9','Brake Inspection',45.00,'2025-06-15','Safety First','Annual inspection','2025-05-28 14:23:42','2025-05-28 14:23:42'),('811fba57-1f72-4c66-a1ff-2f66a2d8b450','2cc31065-0fb7-4609-8d08-51da64d5c4cc','ecfe82a3-c143-4d23-b331-d55cd9e253cf','Oil change',110.00,'2025-06-14','In home','test','2025-06-14 16:07:00','2025-06-14 16:07:00'),('9278ec4d-e4f6-47b1-851f-3dca18a704ae','6b2de218-ba50-4c64-ae13-d874915ab5dd','68b699b5-18d4-42a7-987a-d969bcce0a03','Front bumper',500.00,'2025-05-28','In home','replaced front bumper','2025-05-28 12:12:11','2025-05-28 12:12:11'),('a51d7616-c932-4231-a0e3-162730450f04','fd209ab0-3bce-11f0-ab0b-6479f0559d3f','cae24cb3-094a-4ed4-baa0-2a198aa84c19','Gas',50.00,'2025-05-28','Gas','Gas','2025-05-28 22:15:42','2025-05-28 22:15:42'),('b1df37f5-f5ec-4a0c-a26f-e181f4cb2d1b','12fe0221-fd19-4fe5-9b14-b37926742470','10389d23-be57-4ad9-801c-88566a025011','Oil change',65.00,'2023-05-20','Quick Lube',NULL,'2025-05-28 11:56:07','2025-05-28 11:56:07'),('b53a216d-3684-4e54-810d-b73f76ab55ab','2cc31065-0fb7-4609-8d08-51da64d5c4cc','68b699b5-18d4-42a7-987a-d969bcce0a03','Replaced back bumper',1500.00,'2025-06-02','In home','It had a dent','2025-06-02 16:48:47','2025-06-14 16:07:15'),('c538a018-9e92-4e49-93c7-b7a30d99dccb','fd20314e-3bce-11f0-ab0b-6479f0559d3f','cae24cb3-094a-4ed4-baa0-2a198aa84c19','Gas',35.00,'2025-05-28','Gas','Gas','2025-05-28 22:07:24','2025-05-28 22:07:24');
/*!40000 ALTER TABLE `maintenance_records` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `organizations`
--

DROP TABLE IF EXISTS `organizations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `organizations` (
  `id` varchar(36) NOT NULL,
  `name` varchar(100) NOT NULL,
  `address` varchar(255) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `organizations`
--

LOCK TABLES `organizations` WRITE;
/*!40000 ALTER TABLE `organizations` DISABLE KEYS */;
INSERT INTO `organizations` VALUES ('36debc90-59df-4db4-af5d-78ef4c001ae2','Admin Organization',NULL,NULL,'admin@carfin.com','2025-05-27 17:13:00','2025-05-27 17:13:00');
/*!40000 ALTER TABLE `organizations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` varchar(36) NOT NULL,
  `organization_id` varchar(36) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(100) NOT NULL,
  `first_name` varchar(50) DEFAULT NULL,
  `last_name` varchar(50) DEFAULT NULL,
  `role` varchar(20) DEFAULT 'user',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `organization_id` (`organization_id`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES ('b39334f8-e129-4949-8fd6-eb628bffdbd5','36debc90-59df-4db4-af5d-78ef4c001ae2','admin@carfin.com','$2b$10$mUFkQJaHjtiVgWAlSIh.V.xa4qoTopVW1K3J5TdatgknanOZuXH.O','Admin','User','admin','2025-05-27 17:13:00','2025-05-27 17:13:00');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-06-15  9:17:41
