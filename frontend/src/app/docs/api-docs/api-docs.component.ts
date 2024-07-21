import { Component, OnInit, Input, QueryList, AfterViewInit, ViewChildren } from '@angular/core';
import { Env, StateService } from '../../services/state.service';
import { Observable, merge, of, Subject, Subscription } from 'rxjs';
import { tap, takeUntil } from 'rxjs/operators';
import { ActivatedRoute } from "@angular/router";
import { restApiDocsData } from './api-docs-data';

@Component({
  selector: 'app-api-docs',
  templateUrl: './api-docs.component.html',
  styleUrls: ['./api-docs.component.scss']
})
export class ApiDocsComponent implements OnInit, AfterViewInit {
  private destroy$: Subject<any> = new Subject<any>();
  plainHostname = document.location.hostname;
  hostname = document.location.hostname;
  network$: Observable<string>;
  env: Env;
  code: any;
  baseNetworkUrl = '';
  @Input() whichTab: string;
  desktopDocsNavPosition = "relative";
  restDocs: any[];
  screenWidth: number;
  mobileViewport: boolean = false;
  timeLtrSubscription: Subscription;
  timeLtr: boolean = this.stateService.timeLtr.value;

  dict = {};

  constructor(
    private stateService: StateService,
    private route: ActivatedRoute,
  ) { }

  ngAfterContentChecked() {
    this.desktopDocsNavPosition = ( window.pageYOffset > 115 ) ? "fixed" : "relative";
    this.mobileViewport = window.innerWidth <= 992;
  }

  ngAfterViewInit() {
    const that = this;
    setTimeout( () => {
      if( this.route.snapshot.fragment ) {
        this.openEndpointContainer( this.route.snapshot.fragment );
        if (document.getElementById( this.route.snapshot.fragment )) {
          document.getElementById( this.route.snapshot.fragment ).scrollIntoView();
        }
      }
      window.addEventListener('scroll', that.onDocScroll, { passive: true });
    }, 1 );
  }

  ngOnInit(): void {
    this.env = this.stateService.env;
    this.network$ = merge(of(''), this.stateService.networkChanged$).pipe(
      tap((network: string) => {
        if (this.env.BASE_MODULE === 'bisq' && network !== '') {
          this.baseNetworkUrl = `/${network}`;
        }
        return network;
      })
    );

    if (document.location.port !== '') {
      this.hostname = `${this.hostname}:${document.location.port}`;
    }

    this.hostname = `${document.location.protocol}//${this.hostname}`;

    this.restDocs = restApiDocsData;

    this.timeLtrSubscription = this.stateService.timeLtr.subscribe((ltr) => {
      this.timeLtr = !!ltr;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
    window.removeEventListener('scroll', this.onDocScroll);
    this.timeLtrSubscription.unsubscribe();
  }

  onDocScroll() {
    this.desktopDocsNavPosition = ( window.pageYOffset > 115 ) ? "fixed" : "relative";
  }

  anchorLinkClick( event: any ) {
    let targetId = "";
    if( event.target.nodeName === "A" ) {
      targetId = event.target.hash.substring(1);
    } else {
      let element = event.target;
      while( element.nodeName !== "A" ) {
        element = element.parentElement;
      }
      targetId = element.hash.substring(1);
    }
    if( this.route.snapshot.fragment === targetId && document.getElementById( targetId )) {
      document.getElementById( targetId ).scrollIntoView();
    }
    this.openEndpointContainer( targetId );
  }

  openEndpointContainer( targetId ) {
    let tabHeaderHeight = 0;
    if (document.getElementById( targetId + "-tab-header" )) {
      tabHeaderHeight = document.getElementById( targetId + "-tab-header" ).scrollHeight;
    }
    if( ( window.innerWidth <= 992 ) && ( ( this.whichTab === 'rest' ) ) && targetId ) {
      const endpointContainerEl = document.querySelector<HTMLElement>( "#" + targetId );
      const endpointContentEl = document.querySelector<HTMLElement>( "#" + targetId + " .endpoint-content" );
      const endPointContentElHeight = endpointContentEl.clientHeight;

      if( endpointContentEl.classList.contains( "open" ) ) {
        endpointContainerEl.style.height = "auto";
        endpointContentEl.style.top = "-10000px";
        endpointContentEl.style.opacity = "0";
        endpointContentEl.classList.remove( "open" );
      } else {
        endpointContainerEl.style.height = endPointContentElHeight + tabHeaderHeight + 28 + "px";
        endpointContentEl.style.top = tabHeaderHeight + 28 + "px";
        endpointContentEl.style.opacity = "1";
        endpointContentEl.classList.add( "open" );
      }
    }
  }

  wrapUrl(network: string, code: any, websocket: boolean = false) {

    let curlResponse = code.codeSampleBisq.curl;
    let text = code.codeTemplate.curl;
    for (let index = 0; index < curlResponse.length; index++) {
      const curlText = curlResponse[index];
      const indexNumber = index + 1;
      text = text.replace('%{' + indexNumber + '}', curlText);
    }

    return `${this.hostname}/${network}/api${text}`;
  }

}

