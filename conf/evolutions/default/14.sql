# --- !Ups

CREATE TABLE `lir_backoffice`.`likes` (
  `id` BIGINT(20) NOT NULL AUTO_INCREMENT,
  `story_id` BIGINT(20) NOT NULL,
  `user_id` VARCHAR(255) NOT NULL,
  `date` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `version` INT NOT NULL,
  PRIMARY KEY (`id`));


# --- !Downs

DROP TABLE `lir_backoffice`.`likes`;
