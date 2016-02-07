# --- !Ups


ALTER TABLE `lir_backoffice`.`users`
ADD COLUMN `numberId` BIGINT(20) NOT NULL AUTO_INCREMENT AFTER `version`,
ADD INDEX `numberId` (`numberId` ASC);


# --- !Downs

ALTER TABLE `lir_backoffice`.`users`
DROP COLUMN `numberId`;
