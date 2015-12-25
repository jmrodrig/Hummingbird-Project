# --- !Ups

CREATE  TABLE `lir_backoffice`.`toscas` (
  `id` BIGINT NOT NULL AUTO_INCREMENT ,
  `name` VARCHAR(255) NOT NULL ,
  `email` VARCHAR(255) NOT NULL ,
  `age` INT NULL DEFAULT 0 ,
  `version` BIGINT(20) NOT NULL ,
  PRIMARY KEY (`id`) );

  
# --- !Downs

drop table `lir_backoffice`.`toscas`;
