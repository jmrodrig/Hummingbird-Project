# --- !Ups

CREATE TABLE `lir_backoffice`.`users_story_collections` (
  `id` BIGINT(20) NOT NULL AUTO_INCREMENT,
  `user_id` VARCHAR(255) NOT NULL,
  `collection_id` BIGINT(20) NOT NULL,
  PRIMARY KEY (`id`));

ALTER TABLE `lir_backoffice`.`story_collections`
  DROP COLUMN `user_id`;

# --- !Downs

ALTER TABLE `lir_backoffice`.`story_collections`
  ADD COLUMN `user_id` VARCHAR(255) NOT NULL AFTER `version`;

DROP TABLE `lir_backoffice`.`users_story_collections`
