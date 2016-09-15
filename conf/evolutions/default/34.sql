# --- !Ups

ALTER TABLE `lir_backoffice`.`stories`
ADD COLUMN `views` INT NULL DEFAULT 0 AFTER `date_modified`;


# --- !Downs

ALTER TABLE `lir_backoffice`.`stories`
DROP COLUMN `views`;
