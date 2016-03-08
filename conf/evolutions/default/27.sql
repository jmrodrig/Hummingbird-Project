# --- !Ups

ALTER TABLE `lir_backoffice`.`collections_followers`
ADD INDEX `fk_collection_idx` (`collection_id` ASC);
ALTER TABLE `lir_backoffice`.`collections_followers`
ADD CONSTRAINT `fk_user`
  FOREIGN KEY (`user_id`)
  REFERENCES `lir_backoffice`.`users` (`id`)
  ON DELETE RESTRICT
  ON UPDATE RESTRICT,
ADD CONSTRAINT `fk_collection`
  FOREIGN KEY (`collection_id`)
  REFERENCES `lir_backoffice`.`story_collections` (`id`)
  ON DELETE RESTRICT
  ON UPDATE RESTRICT;

ALTER TABLE `lir_backoffice`.`locations`
ADD COLUMN `name` VARCHAR(255) NULL DEFAULT NULL AFTER `id`,
CHANGE COLUMN `radius` `radius` DOUBLE NULL DEFAULT 0 ,
ADD COLUMN `zoom` TINYINT(1) NULL DEFAULT 16 AFTER `radius`,
ADD COLUMN `showpin` TINYINT(1) NULL DEFAULT 1 AFTER `zoom`;

CREATE TABLE `lir_backoffice`.`highlighted_items` (
  `id` BIGINT(20) NOT NULL AUTO_INCREMENT,
  `item_id` BIGINT(20) NULL,
  `type` TINYINT(1) NULL,
  PRIMARY KEY (`id`));

# --- !Downs

DROP TABLE `lir_backoffice`.`highlighted_items` ;

ALTER TABLE `lir_backoffice`.`locations`
DROP COLUMN `name` ,
CHANGE COLUMN `radius` `radius` DOUBLE NULL DEFAULT 5 ,
DROP COLUMN `zoom` ,
DROP COLUMN `showpin` ;


ALTER TABLE `lir_backoffice`.`collections_followers`
DROP FOREIGN KEY `fk_user`,
DROP FOREIGN KEY `fk_collection`;
ALTER TABLE `lir_backoffice`.`collections_followers`
DROP INDEX `fk_collection_idx` ;
