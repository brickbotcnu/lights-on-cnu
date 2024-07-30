SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

CREATE TABLE `relays` (
  `relayId` int(11) NOT NULL,
  `name` varchar(31) DEFAULT NULL,
  `category` varchar(15) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `sessions` (
  `sessionId` char(36) NOT NULL,
  `user` varchar(31) NOT NULL,
  `expire` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `signup_requests` (
  `user` varchar(31) NOT NULL,
  `passHash` varchar(63) NOT NULL,
  `requestDate` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `users` (
  `user` varchar(31) NOT NULL,
  `passHash` varchar(63) NOT NULL,
  `role` varchar(15) NOT NULL DEFAULT 'user'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `users` (`user`, `passHash`, `role`) VALUES
('infoeducatie', '$2b$10$Aokj9iZgyUxrDi/Z7Hk6LOInasRL6Q6h7WavYxX/KmZJKSwz6HRTG', 'admin');

ALTER TABLE `relays`
  ADD PRIMARY KEY (`relayId`);

ALTER TABLE `sessions`
  ADD PRIMARY KEY (`sessionId`);

ALTER TABLE `signup_requests`
  ADD PRIMARY KEY (`user`);

ALTER TABLE `users`
  ADD PRIMARY KEY (`user`);

DELIMITER $$
CREATE EVENT `deleteExpiredSessions` ON SCHEDULE EVERY 1 MINUTE STARTS '2010-01-01 00:00:00' ON COMPLETION PRESERVE ENABLE COMMENT 'Add event_scheduler=on in my.ini' DO DELETE FROM `sessions` WHERE `expire` < NOW()$$

DELIMITER ;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
