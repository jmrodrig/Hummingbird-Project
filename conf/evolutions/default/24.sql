# --- !Ups


CREATE TABLE `lir_backoffice`.`places` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NULL,
  `osmid` VARCHAR(45) NULL,
  `nwlat` DOUBLE NULL,
  `nwlng` DOUBLE NULL,
  `selat` DOUBLE NULL,
  `selng` DOUBLE NULL,
  PRIMARY KEY (`id`));

ALTER TABLE `lir_backoffice`.`stories`
ADD COLUMN `place_id` BIGINT(20) NULL DEFAULT NULL AFTER `location_id`;


# --- !Downs

ALTER TABLE `lir_backoffice`.`stories`
DROP COLUMN `place_id`;

DROP TABLE `lir_backoffice`.`places`;
