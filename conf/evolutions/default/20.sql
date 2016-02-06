# --- !Ups

ALTER TABLE `lir_backoffice`.`story_collections`
ADD COLUMN `imageUrl` VARCHAR(255) NULL DEFAULT NULL AFTER `version`;


# --- !Downs

ALTER TABLE `lir_backoffice`.`story_collections`
  DROP COLUMN `imageUrl`
