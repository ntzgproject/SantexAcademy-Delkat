import { Component, OnInit } from '@angular/core';
import { HisVenService } from 'src/app/core/services/his-ven.service';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-historial-ventas',
  templateUrl: './historial-ventas.component.html',
  styleUrls: ['./historial-ventas.component.css']
})
export class HistorialVentasComponent implements OnInit {
  
  idVen: number = 0;
  listcategorias: any[] = [];
  articulos: any = [];  
  modelo: any = {
    imaArt: '',
    nomArt: '',
    nomVen: '',    
    catArt: '',
    estArt: '',
    idArt: 0,
    desArt: '',
    preArt: '',
    fecArt: '',
    envArt: '',
    idCat: 0,
  };
  pagArt: string = '';
  articulosVen: any = [];
  datosLog: any = {};
  respuesta: any = [];
  servidor: string = environment.API_URL + '/images/';

  logeadoComprador: boolean = false;
  logeadoVendedor: boolean = false;
  idUser: string = '';
  confVendedor: boolean = false;

  constructor(private service: HisVenService, private router: Router) { }

  ngOnInit(): void {
    this.datosVendedor();
    this.getIdUser();
  }

  datosVendedor() {
    //leer local
    let datosLog = localStorage.getItem('resLog');
    if (datosLog) {
      let newObject = JSON.parse(datosLog);
      this.datosLog = newObject;
      this.idVen = this.datosLog[1].users.id;
    }else{
      Swal.fire({
        icon: 'error',
        title: 'No está logueado',
        confirmButtonText: "Ok"
      });
    }
    //traer y reemplazar nombre vendedor
    this.service.infoVendedor(this.idVen).subscribe(resVen => {
      this.modelo.nomVen = JSON.stringify(resVen.firstName.charAt(0).toUpperCase() + resVen.firstName.slice(1) + ' ' + (resVen.lastName.charAt(0).toUpperCase() + resVen.lastName.slice(1)));
      this.modelo.nomVen = this.modelo.nomVen.slice(1, this.modelo.nomVen.length-1);
    });
    //traer lista de categorias
    this.service.getCategories().subscribe(resCat => {this.listcategorias = resCat; 
    });
    //traer articulos y reemplazar idArt, imaArt, nomArt, desArt, preArt y envArt
    this.service.articulosVendedor(this.idVen).subscribe(res => {
      this.respuesta = res;
      if (JSON.stringify(res.message) == '"Usuario sin productos publicados"') {
        Swal.fire({
          icon: 'error',
          title: 'No tiene productos cargados',
          confirmButtonText: "Ok"
        });
        this.router.navigateByUrl('/');
      }
      for (let i=0; i < res.length; i++) {
        this.modelo.imaArt = this.servidor + this.respuesta[i].Images[0].url;
        this.modelo.idArt = res[i].id;
        this.modelo.nomArt = res[i].nombre.charAt(0).toUpperCase() + res[i].nombre.slice(1);
        this.modelo.desArt = res[i].detalles.charAt(0).toUpperCase() + res[i].detalles.slice(1);
        this.modelo.preArt = res[i].precio;
        this.modelo.fecArt = res[i].createdAt.slice(0, 10);
        if(res[i].estado == false) {
          this.modelo.estArt = 'Alquilado' 
        }else {
          this.modelo.estArt = 'Disponible'
        }
        if(res[i].envio) {
          this.modelo.envArt = 'Envío y retiro';
        }else {
          this.modelo.envArt = 'Retiro';
        }  
        //reemplazar categoria
        if (this.modelo.catArt == '') {
          for (let j=0; j < this.listcategorias.length; j++) {
            if (this.respuesta[i].idTipoProducto == this.listcategorias[j].id) {
              this.modelo.catArt = JSON.stringify(this.listcategorias[j].name.charAt(0).toUpperCase() + this.listcategorias[j].name.slice(1));
              this.modelo.catArt = this.modelo.catArt.slice(1, this.modelo.catArt.length-1);
              this.modelo.idCat = this.listcategorias[j].id;
            }
          }
        }
        //pushear articulo individual en array de articulos
        this.articulos.push({ ...this.modelo });
        this.modelo.catArt = '';
      }  
    })
  }
  //acciones
  redirigirCategoria(idCat: number) {
    localStorage.setItem('idCat', idCat.toString());
    this.router.navigate(['/']);
  }
  visualizar(idProd: number) {
    localStorage.setItem('idProd', idProd.toString());
    this.router.navigate(['vista-articulo']);
  }
  modificar(idProd: number) {
    localStorage.setItem('idProd', idProd.toString());
    this.router.navigate(['modificar-articulo']);    
  }
  eliminar(id: number) {
    if(confirm("¿Desea eliminar el artículo? Esta acción no se puede deshacer")) {
      console.log("Id Prod: " + id);
      this.service.eliminarArticulo(id).subscribe(resEli => {
        console.log("Res eli: " + resEli)
        if(resEli) {
          console.log("Res eli: " + resEli)
          Swal.fire({
            icon: 'success',
            title: 'Artículo borrado con éxito',
            confirmButtonText: "Ok"
          });
          this.router.navigateByUrl('/',{skipLocationChange:true}).then(()=>{
            this.router.navigate(['/historial-ventas']).then(()=>{})
          })
        }else{
          Swal.fire({
            icon: 'error',
            title: 'No se ha podido eliminar su artículo',
            confirmButtonText: "Ok"
          });
        }
      })
    }
  }

  getIdUser() {    
    let infoLocal = localStorage.getItem('resLog');
    if (infoLocal) {
      let newObject = JSON.parse(infoLocal);
      const idUser = newObject[1].users.id;
      this.idUser = idUser;
      const vendedor = newObject[1].users.estadoDeVendedor;
      if (vendedor){
       this.confVendedor = true;
      }
    }
  }

  corroborarLogeo() {    
    let infoLocal = localStorage.getItem('resLog')
    if (infoLocal) {
      let newObject = JSON.parse(infoLocal);
      if (newObject) {
        if (newObject[1].users.estadoDeVendedor) {
          this.logeadoVendedor = true;
          this.logeadoComprador = false;
        }
        else if (!newObject[1].users.estadoDeVendedor) {
          this.logeadoComprador = true;
          this.logeadoVendedor = false;
        } else {
          this.logeadoComprador = false;
          this.logeadoVendedor = false;
        }
      }
    }
  }
}

  
