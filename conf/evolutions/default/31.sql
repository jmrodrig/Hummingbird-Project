# --- !Ups

ALTER TABLE `lir_backoffice`.`locations`
  CHANGE COLUMN `zoom` `zoom` DOUBLE NULL ;

ALTER TABLE `lir_backoffice`.`users`
  ADD COLUMN `first_login` DATETIME NULL DEFAULT NULL AFTER `numberId`;

ALTER TABLE `lir_backoffice`.`stories`
  ADD COLUMN `date_created` DATETIME NULL DEFAULT NULL AFTER `story_language`;

# --- !Downs

ALTER TABLE `lir_backoffice`.`stories`
  DROP COLUMN `date_created` ;

ALTER TABLE `lir_backoffice`.`users`
  DROP COLUMN `first_login` ;

ALTER TABLE `lir_backoffice`.`locations`
  CHANGE COLUMN `zoom` `zoom` TINYINT(1) NULL ;
