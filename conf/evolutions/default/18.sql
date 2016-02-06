# --- !Ups

CREATE TABLE `lir_backoffice`.`story_collections` (
  `id` BIGINT(20) NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NULL DEFAULT NULL,
  `description` LONGTEXT NULL DEFAULT NULL,
  `date` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `version` INT(11) NOT NULL,
  `user_id` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`id`));

CREATE TABLE `lir_backoffice`.`stories_story_collections` (
  `id` BIGINT(20) NOT NULL AUTO_INCREMENT,
  `story_id` BIGINT(20) NOT NULL,
  `collection_id` BIGINT(20) NOT NULL,
  PRIMARY KEY (`id`));


# --- !Downs

DROP TABLE `lir_backoffice`.`stories_story_collections`

DROP TABLE `lir_backoffice`.`story_collections`
